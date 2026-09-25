// RF-M1.5 — Consultar usuarios registrados
// Casos de prueba: CP-019, CP-020, CP-021, CP-022, CP-023

describe('RF-M1.5 — Consultar usuarios registrados', () => {
  beforeEach(() => {
    cy.fixture('usuarios').as('usuarios');
  });

  it('CP-019 — El administrador ve el listado de usuarios paginado', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('usuarios');

    cy.contains('h2', 'Usuarios').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    // El listado viene paginado: nunca muestra más del límite de la vista.
    cy.get('table tbody tr').should('have.length.at.most', 5);
    cy.contains('Numero de identidad').should('be.visible');
  });

  it('CP-020 — El recepcionista también puede consultar el listado', () => {
    cy.entrarComo('recepcionista');
    cy.irASeccion('usuarios');

    cy.contains('h2', 'Usuarios').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('CP-021 — El técnico no tiene acceso a la sección de usuarios', () => {
    cy.entrarComo('tecnico');

    // Ni en el menú lateral ni en los accesos rápidos del panel.
    cy.get('nav.sigat-sidebar').contains('usuarios').should('not.exist');
    cy.contains('.sigat-card-opcion', 'Usuarios').should('not.exist');
  });

  it('CP-022 — El cliente no tiene acceso a la sección de usuarios', () => {
    cy.entrarComo('cliente');

    cy.get('nav.sigat-sidebar').contains('usuarios').should('not.exist');
    cy.contains('.sigat-card-opcion', 'Usuarios').should('not.exist');
  });

  it('CP-023 — El filtro por rol devuelve solo los usuarios de ese rol', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('usuarios');

    // Se consulta en la base qué documentos tienen rol Recepcionista, para
    // comprobar después que el filtro no devuelve ninguno de otro rol.
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE id_rol = 16',
      valores: [],
    }).then((filas) => {
      const recepcionistas = filas.map((f) => String(f.numero_identidad));
      expect(recepcionistas, 'hay al menos un recepcionista registrado').to.not.be.empty;

      cy.get('input[placeholder*="Buscar"]').clear().type('Recepcionista');
      cy.contains('button', 'Buscar').click();

      cy.get('table tbody tr').should('have.length', recepcionistas.length);
      cy.get('table tbody tr td:first-child').each(($celda) => {
        expect(recepcionistas).to.include($celda.text().trim());
      });
    });

    // El botón "resetear" devuelve el listado completo.
    cy.contains('button', 'resetear').click();
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });
});
