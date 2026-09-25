// RF-M2.3 — Editar repuesto
// Casos de prueba: CP-053, CP-054

describe('RF-M2.3 — Editar repuesto', () => {
  const ORIGINAL = 'Cadena CP053';
  const RENOMBRADO = 'Cadena CP053 corregida';

  const limpiar = () => {
    cy.task('borrarRepuesto', ORIGINAL);
    cy.task('borrarRepuesto', RENOMBRADO);
  };

  beforeEach(() => {
    limpiar();
    // Se crea el repuesto que la prueba va a editar.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/repuestos/agregar',
        body: { nombre_repuesto: ORIGINAL, cantidad: 12 },
      }).its('status').should('eq', 201);
    });
  });

  after(() => limpiar());

  /** Abre la ventana de edición de ese repuesto. */
  const abrirEdicion = (nombre) => {
    cy.entrarComo('administrador');
    cy.irASeccion('repuesto');

    cy.get('input[placeholder*="Buscar"]').clear().type(nombre);
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', nombre).find('button').contains('Editar').click();
    cy.contains('.modal-title', 'Editar un Repuesto').should('be.visible');
  };

  it('CP-053 — El administrador edita el nombre y la cantidad de un repuesto', () => {
    abrirEdicion(ORIGINAL);

    cy.get('#repuesto-editar-nombre').clear().type(RENOMBRADO);
    cy.get('#repuesto-editar-cantidad').clear().type('40');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Repuesto actualizado correctamente');

    cy.task('consultaBD', {
      sql: 'SELECT nombre_repuesto, cantidad FROM repuestos WHERE nombre_repuesto = ?',
      valores: [RENOMBRADO],
    }).then((filas) => {
      expect(filas, 'el cambio quedó guardado').to.have.length(1);
      expect(Number(filas[0].cantidad)).to.eq(40);
    });
  });

  it('CP-054 — Rechaza renombrar un repuesto con un nombre que ya existe', () => {
    abrirEdicion(ORIGINAL);

    // "Bujia de prueba" ya existe en los datos de partida.
    cy.get('#repuesto-editar-nombre').clear().type('Bujia de prueba');
    cy.get('#repuesto-editar-cantidad').clear().type('12');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Ya existe un repuesto con ese nombre');

    // El repuesto conserva su nombre original.
    cy.task('consultaBD', {
      sql: 'SELECT nombre_repuesto FROM repuestos WHERE nombre_repuesto = ?',
      valores: [ORIGINAL],
    }).then((filas) => {
      expect(filas, 'el nombre no cambió').to.have.length(1);
    });
  });
});
