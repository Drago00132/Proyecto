// RF-M7.3 — Editar rol
// Casos de prueba: CP-085
//
// Nota: CP-085 también existe en RF-M3.5 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M7)".

describe('RF-M7.3 — Editar rol', () => {
  const ORIGINAL = 'Auxiliar CP085';
  const CORREGIDO = 'Auxiliar de taller';
  let idRol = null;

  const limpiar = () => {
    cy.task('borrarRol', ORIGINAL);
    cy.task('borrarRol', CORREGIDO);
  };

  beforeEach(() => {
    limpiar();
    // Se crea el rol que la prueba va a editar.
    cy.tokenApi('superadministrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/roles/agregar',
        body: { rol: ORIGINAL },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(201);
        idRol = respuesta.body.id_rol;
      });
    });
  });

  after(() => limpiar());

  it('CP-085 (M7) — El súper administrador cambia el nombre de un rol', () => {
    cy.entrarComo('superadministrador');
    cy.irASeccion('roles');

    // El listado viene paginado, así que se ubica el rol por su identificador.
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idRol));
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', ORIGINAL).find('button').contains('Editar').click();
    cy.contains('.modal-title', 'Editar un Rol').should('be.visible');

    // El identificador del rol no se puede cambiar.
    cy.get('#rol-editar-id').should('be.disabled');

    cy.get('#rol-editar-nombre').clear().type(CORREGIDO);
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Rol actualizado correctamente');

    cy.task('consultaBD', {
      sql: 'SELECT rol FROM roles WHERE id_rol = ?',
      valores: [idRol],
    }).then((filas) => {
      expect(filas[0].rol, 'el nombre quedó cambiado').to.eq(CORREGIDO);
    });
  });
});
