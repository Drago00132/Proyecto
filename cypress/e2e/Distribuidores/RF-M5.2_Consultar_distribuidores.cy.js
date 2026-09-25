// RF-M5.2 — Consultar distribuidores
// Casos de prueba: CP-071, CP-072
//
// Nota: CP-071 y CP-072 también existen en RF-M3.2 (la numeración vuelve a
// empezar en el módulo 5), por eso se marcan con "(M5)".

describe('RF-M5.2 — Consultar distribuidores', () => {
  const DISTRIBUIDOR = 'Distribuidora de prueba';

  it('CP-071 (M5) — El administrador consulta el listado de distribuidores', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('distribuidores');

    cy.contains('h2', 'Distribuidores').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    // El listado trae los datos de contacto de cada distribuidor.
    cy.contains('th', 'Teléfono').should('be.visible');
    cy.contains('th', 'Correo').should('be.visible');
    cy.contains('th', 'Dirección').should('be.visible');
    cy.contains('th', 'Contacto').should('be.visible');

    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/distribuidores/listar?limit=999999' })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          const nombres = respuesta.body.distribuidores.map((d) => d.nombre_distribuidor);
          expect(nombres).to.include(DISTRIBUIDOR);
        });
    });

    // La búsqueda por id trae solo ese distribuidor.
    cy.task('consultaBD', {
      sql: 'SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?',
      valores: [DISTRIBUIDOR],
    }).then((filas) => {
      cy.get('input[placeholder*="Buscar"]').clear().type(String(filas[0].id_distribuidor));
      cy.contains('button', 'Buscar').click();

      cy.get('table tbody tr').should('have.length', 1);
      cy.contains('table tbody tr', DISTRIBUIDOR).should('exist');
    });
  });

  it('CP-072 (M5) — Informa que el distribuidor buscado no existe', () => {
    // La pantalla no avisa nada cuando la búsqueda no encuentra: se queda con
    // el listado anterior. El mensaje lo da el servidor, y es ahí donde se
    // comprueba el caso.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'GET',
        url: '/api/distribuidores/consultar/999999',
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(404);
        expect(respuesta.body.message).to.eq('Distribuidor no encontrado');
      });
    });

    cy.entrarComo('administrador');
    cy.irASeccion('distribuidores');

    cy.get('input[placeholder*="Buscar"]').clear().type('999999');
    cy.contains('button', 'Buscar').click();

    // No aparece ninguna fila inventada a partir de una búsqueda fallida.
    cy.contains('table tbody tr', '999999').should('not.exist');
  });
});
