// RF-M1.9 — Registrar usuario por personal interno
// Casos de prueba: CP-034, CP-035, CP-036, CP-037, CP-038, CP-039, CP-040

describe('RF-M1.9 — Registrar usuario por personal interno', () => {
  const DESECHABLES = [
    '1900000820', // CP-034 cliente creado por el administrador
    '1900000821', // CP-035 recepcionista creado por el administrador
    '1900000822', // CP-036 técnico creado por el administrador
    '1900000823', // CP-037 administrador (no debe llegar a crearse)
    '1900000824', // CP-038 cliente creado por el recepcionista
    '1900000825', // CP-039 técnico (no debe llegar a crearse)
    '1900000826', // CP-040 administrador creado por el súper administrador
  ];

  const limpiar = () => {
    DESECHABLES.forEach((identidad) => cy.task('borrarUsuario', identidad));
  };

  before(() => limpiar());
  after(() => limpiar());

  it('CP-034 — El administrador registra un cliente desde la pantalla de usuarios', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('usuarios');

    cy.contains('button', 'Agregar usuarios').click();
    cy.contains('.modal-title', 'Agregar Nuevo Usuario').should('be.visible');

    cy.get('#usuario-agregar-identidad').type('1900000820');
    cy.get('#usuario-agregar-tipo-documento').select('Cedula de Ciudadania');
    cy.get('#usuario-agregar-nombre').type('Nuevo');
    cy.get('#usuario-agregar-apellido').type('Cliente');
    cy.get('#usuario-agregar-fecha-nacimiento').type('1996-02-14');
    cy.get('#usuario-agregar-celular').type('3001110820');
    cy.get('#usuario-agregar-email').type('cp034.pruebas@gmail.com');
    cy.get('#usuario-agregar-contrasena').type('Sigat2026!', { log: false });
    // Se elige por el identificador del rol (3 = Cliente) y no por el texto,
    // porque el nombre del rol se lee de la base y puede estar escrito de
    // varias maneras.
    cy.get('#usuario-agregar-rol').select('3');

    cy.contains('button', 'Agregar').click();
    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000820'],
    }).then((filas) => {
      expect(filas).to.have.length(1);
      expect(Number(filas[0].id_rol)).to.eq(3);
    });
  });

  it('CP-035 — El administrador puede registrar un recepcionista', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario('1900000821', 16, 'cp035.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000821'],
    }).then((filas) => {
      expect(Number(filas[0].id_rol)).to.eq(16);
    });
  });

  it('CP-036 — Al registrar un técnico se le abre su ficha automáticamente', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario('1900000822', 2, 'cp036.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad, reparaciones_asignadas FROM tecnico WHERE numero_identidad = ?',
      valores: ['1900000822'],
    }).then((filas) => {
      expect(filas, 'ficha de técnico creada').to.have.length(1);
      expect(Number(filas[0].reparaciones_asignadas)).to.eq(0);
    });
  });

  it('CP-037 — El administrador no puede registrar a otro administrador', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario('1900000823', 1, 'cp037.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .then((respuesta) => {
            expect(respuesta.status).to.eq(403);
            expect(respuesta.body.message).to.contain('No tienes permiso');
          });
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000823'],
    }).then((filas) => {
      expect(filas, 'no se creó ningún administrador').to.have.length(0);
    });
  });

  it('CP-038 — El recepcionista puede registrar un cliente', () => {
    cy.tokenApi('recepcionista').then((token) => {
      cy.datosUsuario('1900000824', 3, 'cp038.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000824'],
    }).then((filas) => {
      expect(Number(filas[0].id_rol)).to.eq(3);
    });
  });

  it('CP-039 — El recepcionista no puede registrar un técnico', () => {
    cy.tokenApi('recepcionista').then((token) => {
      cy.datosUsuario('1900000825', 2, 'cp039.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .then((respuesta) => {
            expect(respuesta.status).to.eq(403);
            expect(respuesta.body.message).to.contain('No tienes permiso');
          });
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000825'],
    }).then((filas) => {
      expect(filas, 'no se creó ningún técnico').to.have.length(0);
    });
  });

  it('CP-040 — El súper administrador sí puede registrar un administrador', () => {
    cy.tokenApi('superadministrador').then((token) => {
      cy.datosUsuario('1900000826', 1, 'cp040.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000826'],
    }).then((filas) => {
      expect(Number(filas[0].id_rol)).to.eq(1);
    });
  });
});
