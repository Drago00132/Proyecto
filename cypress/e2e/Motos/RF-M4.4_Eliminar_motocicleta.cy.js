// RF-M4.4 — Eliminar motocicleta
// Casos de prueba: CP-105, CP-106

describe('RF-M4.4 — Eliminar motocicleta', () => {
  const PLACA = 'PRB902';

  const limpiar = () => {
    cy.task('borrarMoto', PLACA);
    cy.task('limpiarServicios');
  };

  beforeEach(() => {
    limpiar();
    // Moto desechable del cliente, para no borrar las de partida.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/motos/agregar',
        body: {
          numero_identidad: '1900000001',
          marca_moto: 'Honda',
          modelo_moto: 'XR 150',
          placa: PLACA,
        },
      }).its('status').should('eq', 201);
    });
  });

  after(() => limpiar());

  it('CP-105 — El administrador elimina una motocicleta', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('motos');

    cy.get('input[placeholder*="Buscar"]').clear().type(PLACA);
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', PLACA).find('button').contains('Eliminar').click();
    cy.contains('seguro que quieres eliminar esta Moto').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('Moto eliminado');

    cy.task('consultaBD', {
      sql: 'SELECT placa FROM motos WHERE placa = ?',
      valores: [PLACA],
    }).then((filas) => {
      expect(filas, 'la moto ya no existe').to.have.length(0);
    });
  });

  it('CP-106 — No deja eliminar una motocicleta con un servicio en curso', () => {
    // Se le abre un servicio a esa moto.
    cy.idMoto(PLACA).then((idMoto) => {
      cy.tokenApi('administrador').then((token) => {
        cy.crearServicio(token, {
          id_motos: idMoto,
          descripcion_prodlema: 'Revisión de suspensión delantera y cambio de retenedores',
        });
      });

      cy.entrarComo('administrador');
      cy.irASeccion('motos');

      cy.get('input[placeholder*="Buscar"]').clear().type(PLACA);
      cy.contains('button', 'Buscar').click();

      cy.contains('table tbody tr', PLACA).find('button').contains('Eliminar').click();
      cy.contains('button', 'eliminar').click();

      // En pantalla el aviso es el genérico de la acción.
      cy.verAviso('la Moto no fue eliminado');

      // El motivo concreto lo da el servidor.
      cy.tokenApi('administrador').then((token) => {
        cy.peticionApi(token, {
          method: 'DELETE',
          url: `/api/motos/eliminar/${idMoto}`,
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(409);
          expect(respuesta.body.message).to.contain('servicio activo');
        });
      });

      cy.task('consultaBD', {
        sql: 'SELECT placa FROM motos WHERE placa = ?',
        valores: [PLACA],
      }).then((filas) => {
        expect(filas, 'la moto sigue registrada').to.have.length(1);
      });
    });
  });
});
