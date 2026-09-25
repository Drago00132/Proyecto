// RF-M7.1 — Registrar rol
// Casos de prueba: CP-083
//
// Nota: CP-083 también existe en RF-M3.4 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M7)".

describe('RF-M7.1 — Registrar rol', () => {
  const NUEVO = 'Auxiliar CP083';

  const limpiar = () => {
    cy.task('borrarRol', NUEVO);
  };

  beforeEach(() => limpiar());
  after(() => limpiar());

  it('CP-083 (M7) — El súper administrador registra un rol nuevo', () => {
    cy.entrarComo('superadministrador');
    cy.irASeccion('roles');

    cy.contains('h2', 'Roles').should('be.visible');
    cy.contains('button', 'Agregar Roles').click();
    cy.contains('.modal-title', 'Agregar Nuevo Rol').should('be.visible');

    cy.get('#rol-agregar-nombre').type(NUEVO);
    cy.contains('button', 'Agregar').click();

    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT rol FROM roles WHERE rol = ?',
      valores: [NUEVO],
    }).then((filas) => {
      expect(filas, 'el rol quedó registrado').to.have.length(1);
    });
  });
});
