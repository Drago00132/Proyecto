// RF-M8.2 — Editar técnico
// Casos de prueba: CP-091
//
// Nota: CP-091 también existe en RF-M3.6 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M8)".

describe('RF-M8.2 — Editar técnico', () => {
  const IDENTIDAD = '1900000840';
  let idTecnico = null;

  beforeEach(() => {
    cy.task('borrarUsuario', IDENTIDAD);

    // Se crea un usuario con rol Técnico: el sistema le abre la ficha solo.
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario(IDENTIDAD, 2, 'cp091.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?',
      valores: [IDENTIDAD],
    }).then((filas) => {
      expect(filas, 'la ficha de técnico se creó sola').to.have.length(1);
      idTecnico = filas[0].id_tecnico;
    });
  });

  after(() => {
    cy.task('borrarUsuario', IDENTIDAD);
  });

  it('CP-091 (M8) — El administrador corrige las reparaciones asignadas de un técnico', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('tecnico');

    // El listado viene paginado, así que se ubica la ficha por su identificador.
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idTecnico));
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', IDENTIDAD).find('button').contains('Editar').click();
    cy.contains('.modal-title', 'Editar un Tecnico').should('be.visible');

    // Ni el identificador de la ficha ni el documento del técnico se tocan.
    cy.get('#tecnico-editar-id').should('be.disabled');
    cy.get('#tecnico-editar-identidad').should('be.disabled');

    cy.get('#tecnico-editar-reparaciones').clear().type('3');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Tecnico actualizado correctamente');

    cy.task('consultaBD', {
      sql: 'SELECT reparaciones_asignadas, numero_identidad FROM tecnico WHERE id_tecnico = ?',
      valores: [idTecnico],
    }).then((filas) => {
      expect(Number(filas[0].reparaciones_asignadas)).to.eq(3);
      expect(String(filas[0].numero_identidad), 'el técnico sigue siendo el mismo').to.eq(IDENTIDAD);
    });
  });
});
