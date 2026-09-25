// RF-M3.5 — Eliminar historial
// Casos de prueba: CP-085, CP-086, CP-087, CP-088

describe('RF-M3.5 — Eliminar historial', () => {
  const PROBLEMA = 'Fuga de aceite por la tapa del motor desde hace una semana';

  beforeEach(() => {
    cy.task('limpiarServicios');
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  /** Deja montado un servicio en la moto PRB001. */
  const montarServicio = (extras = {}) => {
    return cy.tokenApi('administrador').then((token) =>
      cy.idMoto('PRB001').then((idMoto) =>
        cy.crearServicio(token, {
          id_motos: idMoto,
          descripcion_prodlema: PROBLEMA,
          ...extras,
        })
      )
    );
  };

  it('CP-085 — El administrador elimina un servicio', () => {
    montarServicio().then((idServicio) => {
      cy.entrarComo('administrador');
      cy.irASeccion('Servicio');

      cy.contains('table tbody tr', 'PRB001').find('button').contains('Eliminar').click();
      cy.contains('¿Seguro que quieres eliminar este Servicio?').should('be.visible');
      cy.contains('button', 'eliminar').click();

      cy.verAviso('Historial eliminado');

      cy.task('consultaBD', {
        sql: 'SELECT id_historial FROM historial WHERE id_historial = ?',
        valores: [idServicio],
      }).then((filas) => {
        expect(filas, 'el servicio ya no existe').to.have.length(0);
      });
    });
  });

  it('CP-086 — Informa cuando el servicio que se quiere eliminar no existe', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: '/api/historial/eliminar/999999',
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(404);
        expect(respuesta.body.message).to.contain('no encontrado');
      });
    });
  });

  it('CP-087 — Con técnico asignado, el cliente no puede eliminarlo pero el administrador sí', () => {
    cy.idTecnicoPrueba().then((idTecnico) => {
      montarServicio({ id_tecnico: idTecnico, estado: 'En Proceso' }).then((idServicio) => {
        // El cliente ya no tiene el botón de eliminar en su fila.
        cy.entrarComo('cliente');
        cy.irASeccion('Servicio');
        cy.contains('table tbody tr', 'PRB001').contains('button', 'Eliminar').should('not.exist');

        // Y el servidor se lo niega.
        cy.tokenApi('cliente').then((token) => {
          cy.peticionApi(token, {
            method: 'DELETE',
            url: `/api/historial/eliminar/${idServicio}`,
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(409);
            expect(respuesta.body.message).to.contain('técnico');
          });
        });

        // El administrador sí puede.
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'DELETE',
            url: `/api/historial/eliminar/${idServicio}`,
          }).its('status').should('eq', 200);
        });

        cy.task('consultaBD', {
          sql: 'SELECT id_historial FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(filas).to.have.length(0);
        });

        // Al eliminarlo se le libera esa reparación al técnico.
        cy.task('consultaBD', {
          sql: 'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?',
          valores: [idTecnico],
        }).then((filas) => {
          expect(Number(filas[0].reparaciones_asignadas)).to.eq(0);
        });
      });
    });
  });

  it('CP-088 — El recepcionista no puede eliminar servicios', () => {
    montarServicio().then((idServicio) => {
      cy.entrarComo('recepcionista');
      cy.irASeccion('Servicio');
      cy.contains('table tbody tr', 'PRB001').contains('button', 'Eliminar').should('not.exist');

      cy.tokenApi('recepcionista').then((token) => {
        cy.peticionApi(token, {
          method: 'DELETE',
          url: `/api/historial/eliminar/${idServicio}`,
        }).its('status').should('eq', 403);
      });

      cy.task('consultaBD', {
        sql: 'SELECT id_historial FROM historial WHERE id_historial = ?',
        valores: [idServicio],
      }).then((filas) => {
        expect(filas, 'el servicio sigue ahí').to.have.length(1);
      });
    });
  });
});
