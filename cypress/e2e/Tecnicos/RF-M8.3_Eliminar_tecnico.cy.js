// RF-M8.3 — Eliminar técnico
// Casos de prueba: CP-092, CP-093
//
// Nota: estos dos códigos son los únicos del módulo 8 que no chocan con otro
// módulo, pero se marcan con "(M8)" igual que sus vecinos, para que todo el
// módulo se lea con el mismo criterio.

describe('RF-M8.3 — Eliminar técnico', () => {
  const IDENTIDAD = '1900000841';
  let idTecnico = null;

  beforeEach(() => {
    cy.task('limpiarServicios');
    cy.task('borrarUsuario', IDENTIDAD);

    // Usuario con rol Técnico: el sistema le abre la ficha solo.
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario(IDENTIDAD, 2, 'cp092.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?',
      valores: [IDENTIDAD],
    }).then((filas) => {
      expect(filas, 'la ficha de técnico se creó sola').to.have.length(1);
      idTecnico = filas[0].id_tecnico;
    });
  });

  after(() => {
    cy.task('limpiarServicios');
    cy.task('borrarUsuario', IDENTIDAD);
  });

  /** Abre el listado y deja a la vista la ficha del técnico desechable. */
  const ubicarFicha = () => {
    cy.entrarComo('administrador');
    cy.irASeccion('tecnico');
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idTecnico));
    cy.contains('button', 'Buscar').click();
  };

  it('CP-092 (M8) — El administrador elimina la ficha de un técnico sin servicios', () => {
    ubicarFicha();

    cy.contains('table tbody tr', IDENTIDAD).find('button').contains('Eliminar').click();
    cy.contains('seguro que quieres eliminar este Tecnico').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('Tecnico eliminado');

    cy.task('consultaBD', {
      sql: 'SELECT id_tecnico FROM tecnico WHERE id_tecnico = ?',
      valores: [idTecnico],
    }).then((filas) => {
      expect(filas, 'la ficha ya no existe').to.have.length(0);
    });

    // La cuenta de usuario del técnico no se borra con la ficha.
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: [IDENTIDAD],
    }).then((filas) => {
      expect(filas, 'el usuario sigue existiendo').to.have.length(1);
    });
  });

  it('CP-093 (M8) — No deja eliminar la ficha de un técnico con un servicio a su cargo', () => {
    // Se le asigna un servicio al técnico desechable.
    cy.idMoto('PRB001').then((idMoto) => {
      cy.tokenApi('administrador').then((token) => {
        cy.crearServicio(token, {
          id_motos: idMoto,
          id_tecnico: idTecnico,
          descripcion_prodlema: 'Cambio de guayas y ajuste de la cadena de transmisión',
          estado: 'En Proceso',
        });
      });
    });

    ubicarFicha();

    cy.contains('table tbody tr', IDENTIDAD).find('button').contains('Eliminar').click();
    cy.contains('button', 'eliminar').click();

    // En pantalla el aviso es el genérico de la acción.
    cy.verAviso('el Tecnico no fue eliminado');

    // El motivo concreto lo da el servidor.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'DELETE', url: `/api/tecnico/eliminar/${idTecnico}` })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(409);
          expect(respuesta.body.message).to.contain('datos relacionados');
        });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_tecnico FROM tecnico WHERE id_tecnico = ?',
      valores: [idTecnico],
    }).then((filas) => {
      expect(filas, 'la ficha sigue existiendo').to.have.length(1);
    });
  });
});
