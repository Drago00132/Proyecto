// RF-M7.2 — Consultar roles
// Casos de prueba: CP-084
//
// Nota: CP-084 también existe en RF-M3.4 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M7)".

describe('RF-M7.2 — Consultar roles', () => {
  it('CP-084 (M7) — El súper administrador consulta el listado de roles', () => {
    cy.entrarComo('superadministrador');
    cy.irASeccion('roles');

    cy.contains('h2', 'Roles').should('be.visible');
    cy.contains('th', 'Id del Rol').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    cy.tokenApi('superadministrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/roles/listar?limit=999999' })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(200);

          // Están los cinco roles con los que funciona el sistema.
          const ids = respuesta.body.rol.map((r) => Number(r.id_rol));
          [1, 2, 3, 16, 17].forEach((id) => expect(ids).to.include(id));
        });
    });

    // La gestión de roles es exclusiva del súper administrador.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/roles/listar' })
        .its('status').should('eq', 403);
    });
  });
});
