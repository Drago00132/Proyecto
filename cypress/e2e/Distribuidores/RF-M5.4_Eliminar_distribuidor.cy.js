// RF-M5.4 — Eliminar distribuidor
// Casos de prueba: CP-074
//
// Nota: CP-074 también existe en RF-M3.2 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M5)".

describe('RF-M5.4 — Eliminar distribuidor', () => {
  const NOMBRE = 'Repuestos del Este CP074';
  let idDistribuidor = null;

  const limpiar = () => {
    cy.task('borrarDistribuidor', NOMBRE);
  };

  beforeEach(() => {
    limpiar();
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/distribuidores/agregar',
        body: {
          nombre_distribuidor: NOMBRE,
          telefono: '3004445566',
          correo: 'este.pruebas@gmail.com',
          direccion: 'Diagonal 8 # 9-10',
          contacto: 'Marta Contacto',
        },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(201);
        idDistribuidor = respuesta.body.id_distribuidor;
      });
    });
  });

  after(() => limpiar());

  it('CP-074 (M5) — El administrador elimina un distribuidor', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('distribuidores');

    cy.get('input[placeholder*="Buscar"]').clear().type(String(idDistribuidor));
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', NOMBRE).find('button').contains('Eliminar').click();
    cy.contains('seguro que quieres eliminar este Distribuidor').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('Distribuidor eliminado');

    cy.task('consultaBD', {
      sql: 'SELECT id_distribuidor FROM distribuidores WHERE id_distribuidor = ?',
      valores: [idDistribuidor],
    }).then((filas) => {
      expect(filas, 'el distribuidor ya no existe').to.have.length(0);
    });

    // Y si se vuelve a pedir su eliminación, el sistema informa que no existe.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: `/api/distribuidores/eliminar/${idDistribuidor}`,
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(404);
        expect(respuesta.body.message).to.eq('Distribuidor no encontrado');
      });
    });
  });
});
