// RF-M2.1 — Registrar repuesto
// Casos de prueba: CP-046, CP-047, CP-048

describe('RF-M2.1 — Registrar repuesto', () => {
  const NUEVO = 'Pastilla de freno CP046';

  const limpiar = () => {
    cy.task('borrarRepuesto', NUEVO);
  };

  beforeEach(() => limpiar());
  after(() => limpiar());

  /** Abre la ventana de registro desde la pantalla de Repuestos. */
  const abrirFormulario = () => {
    cy.entrarComo('administrador');
    cy.irASeccion('repuesto');
    cy.contains('button', 'Agregar Repuesto').click();
    cy.contains('.modal-title', 'Agregar Nuevo Repuesto').should('be.visible');
  };

  it('CP-046 — El administrador registra un repuesto nuevo', () => {
    abrirFormulario();

    cy.get('#repuesto-agregar-nombre').type(NUEVO);
    cy.get('#repuesto-agregar-cantidad').type('30');
    cy.contains('button', /^\s*Agregar\s*$/).click();

    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT cantidad FROM repuestos WHERE nombre_repuesto = ?',
      valores: [NUEVO],
    }).then((filas) => {
      expect(filas, 'el repuesto quedó guardado').to.have.length(1);
      expect(Number(filas[0].cantidad)).to.eq(30);
    });
  });

  it('CP-047 — Rechaza un nombre de repuesto que ya existe', () => {
    abrirFormulario();

    // "Bujia de prueba" ya viene cargado con los datos de partida.
    cy.get('#repuesto-agregar-nombre').type('Bujia de prueba');
    cy.get('#repuesto-agregar-cantidad').type('5');
    cy.contains('button', /^\s*Agregar\s*$/).click();

    cy.verAviso('Ya existe un repuesto con ese nombre');

    // No se creó un segundo registro con el mismo nombre.
    cy.task('consultaBD', {
      sql: 'SELECT COUNT(*) AS total FROM repuestos WHERE nombre_repuesto = ?',
      valores: ['Bujia de prueba'],
    }).then((filas) => {
      expect(Number(filas[0].total)).to.eq(1);
    });
  });

  it('CP-048 — Rechaza una cantidad negativa', () => {
    abrirFormulario();

    cy.get('#repuesto-agregar-nombre').type(NUEVO);
    cy.get('#repuesto-agregar-cantidad').type('-5');
    cy.contains('button', /^\s*Agregar\s*$/).click();

    cy.verAviso('La cantidad debe ser un número mayor o igual a 0');

    cy.task('consultaBD', {
      sql: 'SELECT nombre_repuesto FROM repuestos WHERE nombre_repuesto = ?',
      valores: [NUEVO],
    }).then((filas) => {
      expect(filas, 'no se guardó nada').to.have.length(0);
    });
  });
});
