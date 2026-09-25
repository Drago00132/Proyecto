// RF-M3.3 — Modificar historial
// Casos de prueba: CP-076, CP-077, CP-078, CP-079, CP-080

describe('RF-M3.3 — Modificar historial', () => {
  const PROBLEMA = 'Pérdida de potencia al subir pendientes y consumo alto';
  const TRABAJO = 'Se limpió el carburador y se cambió el filtro de aire';

  beforeEach(() => {
    cy.task('limpiarServicios');
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  /** Deja montado un servicio en la moto PRB001 con los datos indicados. */
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

  it('CP-076 — El técnico registra el avance del servicio que tiene asignado', () => {
    cy.idTecnicoPrueba().then((idTecnico) => {
      montarServicio({ id_tecnico: idTecnico, estado: 'En Proceso' }).then((idServicio) => {
        cy.entrarComo('tecnico');
        cy.irASeccion('Servicio');

        cy.contains('table tbody tr', 'PRB001').find('button').contains('Actualizar').click();
        cy.contains('.modal-title', 'Editar un Servicio').should('be.visible');

        cy.get('#historial-editar-descripcion-trabajo').clear().type(TRABAJO);
        cy.contains('button', 'Guardar').click();

        cy.verAviso('Historial actualizado correctamente');

        cy.task('consultaBD', {
          sql: 'SELECT descripcion_trabajo FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(filas[0].descripcion_trabajo).to.eq(TRABAJO);
        });
      });
    });
  });

  it('CP-077 — No deja modificar un servicio que ya fue finalizado', () => {
    cy.idTecnicoPrueba().then((idTecnico) => {
      montarServicio({ id_tecnico: idTecnico, estado: 'Finalizado' }).then((idServicio) => {
        // En pantalla el técnico ya no tiene el botón de actualizar.
        cy.entrarComo('tecnico');
        cy.irASeccion('Servicio');
        cy.contains('table tbody tr', 'PRB001').should('exist');
        cy.contains('table tbody tr', 'PRB001').contains('button', 'Actualizar').should('not.exist');

        // Y si la petición se envía de todos modos, el servidor la rechaza.
        cy.tokenApi('tecnico').then((token) => {
          cy.peticionApi(token, {
            method: 'PUT',
            url: `/api/historial/actualizar/${idServicio}`,
            body: { descripcion_trabajo: 'Intento sobre un servicio cerrado' },
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(409);
            expect(respuesta.body.message).to.contain('finalizado');
          });
        });
      });
    });
  });

  it('CP-078 — El cliente no puede modificar el servicio una vez tiene técnico asignado', () => {
    // Mientras nadie lo atiende, el cliente puede corregir su propio reporte;
    // desde que se le asigna un técnico, el servicio deja de estar en sus
    // manos y el sistema le niega la modificación.
    cy.idTecnicoPrueba().then((idTecnico) => {
      montarServicio({ id_tecnico: idTecnico, estado: 'En Proceso' }).then((idServicio) => {
        cy.entrarComo('cliente');
        cy.irASeccion('Servicio');
        cy.contains('table tbody tr', 'PRB001').contains('button', 'Actualizar').should('not.exist');

        cy.tokenApi('cliente').then((token) => {
          cy.peticionApi(token, {
            method: 'PUT',
            url: `/api/historial/actualizar/${idServicio}`,
            body: { descripcion_prodlema: 'El cliente intenta cambiar el diagnóstico' },
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(409);
            expect(respuesta.body.message).to.contain('técnico');
          });
        });

        cy.task('consultaBD', {
          sql: 'SELECT descripcion_prodlema FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(filas[0].descripcion_prodlema, 'el reporte no cambió').to.eq(PROBLEMA);
        });
      });
    });
  });

  it('CP-079 — El recepcionista sí puede cambiar el técnico asignado', () => {
    montarServicio().then((idServicio) => {
      cy.idTecnicoPrueba().then((idTecnico) => {
        cy.entrarComo('recepcionista');
        cy.irASeccion('Servicio');

        cy.contains('table tbody tr', 'PRB001').find('button').contains('Actualizar').click();
        cy.get('#historial-editar-tecnico').select(String(idTecnico));
        cy.contains('button', 'Guardar').click();

        cy.verAviso('Historial actualizado correctamente');

        cy.task('consultaBD', {
          sql: 'SELECT id_tecnico, estado FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(Number(filas[0].id_tecnico)).to.eq(Number(idTecnico));
          // Al quedar asignado, el servicio pasa a estar en proceso.
          expect(filas[0].estado).to.eq('En Proceso');
        });
      });
    });
  });

  it('CP-080 — El recepcionista no puede tocar el diagnóstico', () => {
    montarServicio().then((idServicio) => {
      cy.entrarComo('recepcionista');
      cy.irASeccion('Servicio');

      cy.contains('table tbody tr', 'PRB001').find('button').contains('Actualizar').click();

      // En pantalla el campo viene bloqueado y con la explicación al lado.
      cy.get('#historial-editar-descripcion-problema').should('be.disabled');
      cy.contains('solo puedes gestionar la asignación de técnico').should('be.visible');

      // Y aunque se envíe por fuera de la pantalla, el sistema lo ignora.
      cy.tokenApi('recepcionista').then((token) => {
        cy.peticionApi(token, {
          method: 'PUT',
          url: `/api/historial/actualizar/${idServicio}`,
          body: {
            descripcion_prodlema: 'El recepcionista intenta escribir el diagnóstico',
            estado: 'Finalizado',
          },
        }).its('status').should('eq', 200);
      });

      cy.task('consultaBD', {
        sql: 'SELECT descripcion_prodlema, estado FROM historial WHERE id_historial = ?',
        valores: [idServicio],
      }).then((filas) => {
        expect(filas[0].descripcion_prodlema, 'el diagnóstico no cambió').to.eq(PROBLEMA);
        expect(filas[0].estado, 'el estado tampoco cambió').to.not.eq('Finalizado');
      });
    });
  });
});
