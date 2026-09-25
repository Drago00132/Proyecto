// RF-M2.4 — Eliminar repuesto
// Casos de prueba: CP-055, CP-056, CP-057

describe('RF-M2.4 — Eliminar repuesto', () => {
  const DESECHABLE = 'Farola CP055';

  /** Crea el repuesto que la prueba va a eliminar. */
  const crearRepuesto = () => {
    cy.task('borrarRepuesto', DESECHABLE);
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/repuestos/agregar',
        body: { nombre_repuesto: DESECHABLE, cantidad: 8 },
      }).its('status').should('eq', 201);
    });
  };

  /** Elimina ese repuesto desde la pantalla, con el rol indicado. */
  const eliminarDesdeLaPantalla = (rol) => {
    cy.entrarComo(rol);
    cy.irASeccion('repuesto');

    cy.get('input[placeholder*="Buscar"]').clear().type(DESECHABLE);
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', DESECHABLE).find('button').contains('Eliminar').click();
    cy.contains('seguro que quieres eliminar').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('Repuesto eliminado');

    cy.task('consultaBD', {
      sql: 'SELECT nombre_repuesto FROM repuestos WHERE nombre_repuesto = ?',
      valores: [DESECHABLE],
    }).then((filas) => {
      expect(filas, 'el repuesto ya no existe').to.have.length(0);
    });
  };

  after(() => {
    cy.task('borrarRepuesto', DESECHABLE);
  });

  it('CP-055 — El administrador elimina un repuesto', () => {
    crearRepuesto();
    eliminarDesdeLaPantalla('administrador');
  });

  it('CP-056 — El recepcionista también puede eliminar un repuesto', () => {
    crearRepuesto();
    eliminarDesdeLaPantalla('recepcionista');
  });

  it('CP-057 — Informa cuando el repuesto que se quiere eliminar no existe', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: '/api/repuestos/eliminar/999999',
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(404);
        expect(respuesta.body.message).to.contain('no encontrado');
      });
    });
  });
});
