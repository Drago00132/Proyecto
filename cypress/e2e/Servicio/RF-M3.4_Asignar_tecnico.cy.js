// RF-M3.4 — Asignar técnico a historial
// Casos de prueba: CP-081, CP-082, CP-083, CP-084

describe('RF-M3.4 — Asignar técnico a historial', () => {
  const PROBLEMA = 'La moto se apaga en los semáforos y cuesta encenderla';

  beforeEach(() => {
    cy.task('limpiarServicios');
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  /** Deja montado un servicio sin técnico en la moto PRB001. */
  const montarServicioSinTecnico = (extras = {}) => {
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

  /** Abre la ventana de asignación desde el botón fijo del panel. */
  const abrirAsignacion = (rol) => {
    cy.entrarComo(rol);
    cy.contains('button', 'Asignar técnico').click();
    cy.contains('.modal-title', 'Asignar técnico').should('be.visible');
  };

  it('CP-081 — El administrador asigna un técnico a un servicio pendiente', () => {
    montarServicioSinTecnico().then((idServicio) => {
      cy.idTecnicoPrueba().then((idTecnico) => {
        abrirAsignacion('administrador');

        cy.get('#asignar-tecnico').select(String(idTecnico));
        cy.get('#asignar-historial').select(String(idServicio));
        cy.contains('button', 'Asignar').click();

        cy.verAviso('Técnico asignado correctamente');

        cy.task('consultaBD', {
          sql: 'SELECT id_tecnico, estado FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(Number(filas[0].id_tecnico)).to.eq(Number(idTecnico));
          expect(filas[0].estado).to.eq('En Proceso');
        });

        // La asignación le suma una reparación al técnico.
        cy.task('consultaBD', {
          sql: 'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?',
          valores: [idTecnico],
        }).then((filas) => {
          expect(Number(filas[0].reparaciones_asignadas)).to.eq(1);
        });
      });
    });
  });

  it('CP-082 — El recepcionista también puede asignar un técnico', () => {
    montarServicioSinTecnico().then((idServicio) => {
      cy.idTecnicoPrueba().then((idTecnico) => {
        abrirAsignacion('recepcionista');

        cy.get('#asignar-tecnico').select(String(idTecnico));
        cy.get('#asignar-historial').select(String(idServicio));
        cy.contains('button', 'Asignar').click();

        cy.verAviso('Técnico asignado correctamente');

        cy.task('consultaBD', {
          sql: 'SELECT id_tecnico FROM historial WHERE id_historial = ?',
          valores: [idServicio],
        }).then((filas) => {
          expect(Number(filas[0].id_tecnico)).to.eq(Number(idTecnico));
        });
      });
    });
  });

  it('CP-083 — No deja asignar técnico a un servicio ya finalizado', () => {
    montarServicioSinTecnico({ estado: 'Finalizado' }).then((idServicio) => {
      // El servicio cerrado ni siquiera aparece en la lista de pendientes.
      abrirAsignacion('recepcionista');
      cy.get('#asignar-historial').find('option').should('not.contain', `#${idServicio}`);

      // Y si la petición se envía de todos modos, el servidor la rechaza.
      cy.idTecnicoPrueba().then((idTecnico) => {
        cy.tokenApi('recepcionista').then((token) => {
          cy.peticionApi(token, {
            method: 'PUT',
            url: `/api/historial/actualizar/${idServicio}`,
            body: { id_tecnico: idTecnico },
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(409);
            expect(respuesta.body.message).to.contain('finalizado');
          });
        });
      });

      cy.task('consultaBD', {
        sql: 'SELECT id_tecnico FROM historial WHERE id_historial = ?',
        valores: [idServicio],
      }).then((filas) => {
        expect(filas[0].id_tecnico, 'sigue sin técnico asignado').to.be.null;
      });
    });
  });

  it('CP-084 — El técnico se puede elegir por su nombre y se ve su carga de trabajo', () => {
    montarServicioSinTecnico().then(() => {
      abrirAsignacion('administrador');

      // Cada opción muestra el nombre del técnico y cuántas reparaciones
      // tiene asignadas, para poder repartir el trabajo.
      cy.get('#asignar-tecnico').find('option').contains('Tomas Pruebas').should('exist');
      cy.get('#asignar-tecnico').select('Tomas Pruebas — 0 reparaciones asignadas');

      cy.idTecnicoPrueba().then((idTecnico) => {
        cy.get('#asignar-tecnico').should('have.value', String(idTecnico));
      });
    });
  });
});
