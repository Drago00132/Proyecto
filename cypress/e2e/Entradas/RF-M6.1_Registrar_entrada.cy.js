// RF-M6.1 — Registrar entrada de repuestos
// Casos de prueba: CP-077, CP-078
//
// Nota: en el documento de Casos de Prueba estos códigos vuelven a empezar en
// el módulo 5, así que CP-077 y CP-078 también existen en RF-M3.3. Se marcan
// con "(M6)" para poder distinguirlos en el informe de las pruebas.

describe('RF-M6.1 — Registrar entrada de repuestos', () => {
  const REPUESTO = 'Bujia de prueba';
  const DISTRIBUIDOR = 'Distribuidora de prueba';

  /** Cantidad que tiene ahora mismo ese repuesto en el inventario. */
  const stockDe = (nombre) =>
    cy.task('consultaBD', {
      sql: 'SELECT cantidad FROM repuestos WHERE nombre_repuesto = ?',
      valores: [nombre],
    }).then((filas) => Number(filas[0].cantidad));

  /** Abre el formulario desde el botón fijo del panel. */
  const abrirFormulario = (rol) => {
    cy.entrarComo(rol);
    cy.contains('button', 'Registrar entrada').click();
    cy.contains('.modal-title', 'Registrar entrada de repuestos').should('be.visible');
  };

  it('CP-077 (M6) — El administrador registra una entrada y el inventario sube', () => {
    stockDe(REPUESTO).then((stockAntes) => {
      abrirFormulario('administrador');

      cy.get('#entrada-agregar-fecha').type('2026-03-10');
      cy.get('#entrada-agregar-cantidad').type('5');
      cy.get('#entrada-agregar-repuesto').select(REPUESTO);
      cy.get('#entrada-agregar-distribuidor').select(DISTRIBUIDOR);
      cy.get('#entrada-agregar-usuario').select('1900000010');
      cy.contains('button', 'Agregar').click();

      cy.verAviso('reguistro Exitoso');

      // La entrada queda guardada...
      cy.task('consultaBD', {
        sql: `SELECT e.id_entrada, e.cantidad_ingresada
              FROM entrada_repuestos e
              JOIN repuestos r ON e.id_repuestos = r.id_repuestos
              WHERE r.nombre_repuesto = ? AND e.fecha_entrada = ?`,
        valores: [REPUESTO, '2026-03-10'],
      }).then((filas) => {
        expect(filas, 'la entrada quedó registrada').to.have.length(1);
        expect(Number(filas[0].cantidad_ingresada)).to.eq(5);

        // ...y el sistema le suma esas unidades al inventario.
        stockDe(REPUESTO).then((stockDespues) => {
          expect(stockDespues, 'el inventario subió lo ingresado').to.eq(stockAntes + 5);
        });

        // Se deshace para dejar el inventario como estaba.
        cy.task('borrarEntrada', filas[0].id_entrada);
      });
    });
  });

  it('CP-078 (M6) — Rechaza una cantidad inválida y no toca el inventario', () => {
    stockDe(REPUESTO).then((stockAntes) => {
      abrirFormulario('administrador');

      cy.get('#entrada-agregar-fecha').type('2026-03-11');
      cy.get('#entrada-agregar-cantidad').type('-3');
      cy.get('#entrada-agregar-repuesto').select(REPUESTO);
      cy.get('#entrada-agregar-distribuidor').select(DISTRIBUIDOR);
      cy.get('#entrada-agregar-usuario').select('1900000010');
      cy.contains('button', 'Agregar').click();

      cy.verAviso('La cantidad ingresada debe ser un número mayor a 0');

      cy.task('consultaBD', {
        sql: 'SELECT id_entrada FROM entrada_repuestos WHERE fecha_entrada = ?',
        valores: ['2026-03-11'],
      }).then((filas) => {
        expect(filas, 'no se registró ninguna entrada').to.have.length(0);
      });

      stockDe(REPUESTO).then((stockDespues) => {
        expect(stockDespues, 'el inventario quedó igual').to.eq(stockAntes);
      });
    });
  });
});
