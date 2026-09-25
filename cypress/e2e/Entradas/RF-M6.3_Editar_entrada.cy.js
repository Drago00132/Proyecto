// RF-M6.3 — Editar entrada de repuestos
// Casos de prueba: CP-081
//
// Nota: CP-081 también existe en RF-M3.4 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M6)".

describe('RF-M6.3 — Editar entrada de repuestos', () => {
  const REPUESTO = 'Bujia de prueba';
  let idEntrada = null;

  const stockDe = (nombre) =>
    cy.task('consultaBD', {
      sql: 'SELECT cantidad FROM repuestos WHERE nombre_repuesto = ?',
      valores: [nombre],
    }).then((filas) => Number(filas[0].cantidad));

  beforeEach(() => {
    cy.idRepuesto(REPUESTO).then((idRepuesto) => {
      cy.task('consultaBD', {
        sql: 'SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?',
        valores: ['Distribuidora de prueba'],
      }).then((filas) => {
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/entradaRepuestos/agregar',
            body: {
              fecha_entrada: '2026-03-13',
              cantidad_ingresada: 5,
              id_repuestos: idRepuesto,
              id_distribuidor: filas[0].id_distribuidor,
              numero_identidad: '1900000010',
            },
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(201);
            idEntrada = respuesta.body.id_entrada;
          });
        });
      });
    });
  });

  afterEach(() => {
    if (idEntrada) cy.task('borrarEntrada', idEntrada);
  });

  it('CP-081 (M6) — El administrador corrige la cantidad y el inventario se ajusta', () => {
    stockDe(REPUESTO).then((stockAntes) => {
      cy.entrarComo('administrador');
      cy.irASeccion('entrada de repuestos');

      cy.get('input[placeholder*="Buscar"]').clear().type(String(idEntrada));
      cy.contains('button', 'Buscar').click();

      cy.contains('table tbody tr', REPUESTO).find('button').contains('Editar').click();
      cy.contains('.modal-title', 'Editar Entrada').should('be.visible');

      // Se corrige de 5 a 8 unidades.
      cy.get('#entrada-editar-cantidad').clear().type('8');
      cy.contains('button', 'Guardar').click();

      cy.verAviso('Entrada actualizada correctamente');

      cy.task('consultaBD', {
        sql: 'SELECT cantidad_ingresada FROM entrada_repuestos WHERE id_entrada = ?',
        valores: [idEntrada],
      }).then((filas) => {
        expect(Number(filas[0].cantidad_ingresada)).to.eq(8);
      });

      // El inventario recibe solo la diferencia: 3 unidades más.
      stockDe(REPUESTO).then((stockDespues) => {
        expect(stockDespues, 'el inventario se ajustó a la corrección').to.eq(stockAntes + 3);
      });
    });
  });
});
