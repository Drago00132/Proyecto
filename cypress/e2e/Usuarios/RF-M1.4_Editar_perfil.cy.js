// RF-M1.4 — Editar perfil propio
// Casos de prueba: CP-014, CP-015, CP-016, CP-017, CP-018

describe('RF-M1.4 — Editar perfil propio', () => {
  beforeEach(() => {
    cy.fixture('usuarios').as('usuarios');
  });

  it('CP-014 — El usuario edita sus propios datos y el cambio queda guardado', function () {
    const u = this.usuarios.cliente;
    const nombreNuevo = 'Cliente Editado';

    cy.entrarComo('cliente');
    cy.irASeccion('mi perfil');

    cy.get('#miperfil-nombre').clear().type(nombreNuevo);
    cy.get('#miperfil-celular').clear().type('3019876543');
    cy.contains('button', 'Guardar cambios').click();

    cy.verAviso('Perfil actualizado correctamente');

    // El dato queda realmente guardado en la base, no solo en pantalla.
    cy.task('consultaBD', {
      sql: 'SELECT nombre, numero_celular FROM usuarios WHERE correo_electronico = ?',
      valores: [u.correo],
    }).then((filas) => {
      expect(filas[0].nombre).to.eq(nombreNuevo);
      expect(String(filas[0].numero_celular)).to.eq('3019876543');
    });

    // Se deja el perfil como estaba para no afectar a las demás pruebas.
    cy.get('#miperfil-nombre').clear().type('Cliente');
    cy.get('#miperfil-celular').clear().type('3001111111');
    cy.contains('button', 'Guardar cambios').click();
    cy.verAviso('Perfil actualizado correctamente');
  });

  it('CP-015 — El documento, el tipo de documento y la fecha de nacimiento no se pueden editar desde el perfil', () => {
    cy.entrarComo('cliente');
    cy.irASeccion('mi perfil');

    cy.get('#miperfil-identidad').should('be.disabled');
    cy.get('#miperfil-tipo-documento').should('be.disabled');
    cy.get('#miperfil-fecha-nacimiento').should('be.disabled');

    // El aviso que explica quién sí puede cambiarlos está a la vista.
    cy.contains('solo el Administrador o Super Administrador pueden modificarlos').should('be.visible');
  });

  it('CP-016 — El súper administrador sí puede cambiarle el rol a otro usuario', () => {
    const identidad = '1900000801';

    cy.tokenApi('superadministrador').then((token) => {
      // Se crea un usuario desechable con rol Cliente.
      cy.task('borrarUsuario', identidad);
      cy.datosUsuario(identidad, 3, 'cp016.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);

        // El súper administrador lo pasa a Recepcionista.
        cy.peticionApi(token, {
          method: 'PUT',
          url: `/api/usuarios/actualizar/${identidad}`,
          body: { ...datos, id_rol: 16 },
        }).its('status').should('eq', 200);
      });

      cy.task('consultaBD', {
        sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
        valores: [identidad],
      }).then((filas) => {
        expect(Number(filas[0].id_rol)).to.eq(16);
      });

      cy.task('borrarUsuario', identidad);
    });
  });

  it('CP-017 — Un administrador no puede editar a otro administrador', function () {
    const otroAdmin = this.usuarios.administrador2;

    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'PUT',
        url: `/api/usuarios/actualizar/${otroAdmin.numero_identidad}`,
        body: {
          numero_identidad: otroAdmin.numero_identidad,
          tipo_documento: 'Cedula de Ciudadania',
          nombre: 'Intento',
          apellido: 'Denegado',
          fecha_nacimiento: '1990-01-01',
          numero_celular: '3001234567',
          correo_electronico: otroAdmin.correo,
          id_rol: 1,
        },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(403);
        expect(respuesta.body.message).to.contain('No tienes permiso');
      });
    });
  });

  it('CP-018 — Un recepcionista no puede editar a un técnico', function () {
    const tecnico = this.usuarios.tecnico;

    cy.tokenApi('recepcionista').then((token) => {
      cy.peticionApi(token, {
        method: 'PUT',
        url: `/api/usuarios/actualizar/${tecnico.numero_identidad}`,
        body: {
          numero_identidad: tecnico.numero_identidad,
          tipo_documento: 'Cedula de Ciudadania',
          nombre: 'Intento',
          apellido: 'Denegado',
          fecha_nacimiento: '1990-01-01',
          numero_celular: '3001234567',
          correo_electronico: tecnico.correo,
          id_rol: 2,
        },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(403);
        expect(respuesta.body.message).to.contain('No tienes permiso');
      });
    });
  });
});
