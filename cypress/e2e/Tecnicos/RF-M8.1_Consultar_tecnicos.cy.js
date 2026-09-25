// RF-M8.1 — Consultar técnicos
// Casos de prueba: CP-089, CP-090
//
// Nota: en el documento de Casos de Prueba estos códigos vuelven a empezar en
// el módulo 5, así que CP-089 y CP-090 también existen en RF-M3.6. Se marcan
// con "(M8)" para poder distinguirlos en el informe de las pruebas.

describe('RF-M8.1 — Consultar técnicos', () => {
  it('CP-089 (M8) — El administrador consulta el listado de técnicos', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('tecnico');

    cy.contains('h2', 'Tecnicos').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    // El listado dice quién es cada técnico y cuánto trabajo tiene encima.
    cy.contains('th', 'Numero de identidad').should('be.visible');
    cy.contains('th', 'Nombre y apellido').should('be.visible');
    cy.contains('th', 'Reparaciones asignadas').should('be.visible');

    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/tecnico/listar?limit=999999' })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          const identidades = respuesta.body.tecnico.map((t) => String(t.numero_identidad));
          expect(identidades).to.include('1900000002');
        });
    });
  });

  it('CP-090 (M8) — El técnico solo alcanza su propia ficha, no la de los demás', () => {
    // En el listado el técnico se ve únicamente a sí mismo.
    cy.tokenApi('tecnico').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/tecnico/listar?limit=999999' })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          const identidades = respuesta.body.tecnico.map((t) => String(t.numero_identidad));
          expect(identidades, 'solo aparece él').to.deep.eq(['1900000002']);
        });

      // Y la consulta de una ficha por su identificador le está negada: la
      // gestión de fichas es del Administrador y del Súper Administrador.
      cy.idTecnicoPrueba().then((idTecnico) => {
        cy.peticionApi(token, { method: 'GET', url: `/api/tecnico/consultar/${idTecnico}` })
          .its('status').should('eq', 403);
      });
    });

    // Tampoco tiene la sección en su menú.
    cy.entrarComo('tecnico');
    cy.get('nav.sigat-sidebar').contains('tecnico').should('not.exist');
  });
});
