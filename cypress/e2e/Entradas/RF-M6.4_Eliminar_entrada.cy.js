// RF-M6.4 — Eliminar entrada de repuestos
// Casos de prueba: CP-082
//
// Nota: CP-082 también existe en RF-M3.4 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M6)".

describe('RF-M6.4 — Eliminar entrada de repuestos', () => {
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
              fecha_entrada: '2026-03-14',
              cantidad_ingresada: 6,
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

  it('CP-082 (M6) — El administrador elimina una entrada y el inventario se devuelve', () => {
    stockDe(REPUESTO).then((stockAntes) => {
      cy.entrarComo('administrador');
      cy.irASeccion('entrada de repuestos');

      cy.get('input[placeholder*="Buscar"]').clear().type(String(idEntrada));
      cy.contains('button', 'Buscar').click();

      cy.contains('table tbody tr', REPUESTO).find('button').contains('Eliminar').click();
      cy.contains('seguro que quieres eliminar esta Entrada').should('be.visible');
      cy.contains('button', 'eliminar').click();

      cy.verAviso('Entrada eliminada');

      cy.task('consultaBD', {
        sql: 'SELECT id_entrada FROM entrada_repuestos WHERE id_entrada = ?',
        valores: [idEntrada],
      }).then((filas) => {
        expect(filas, 'la entrada ya no existe').to.have.length(0);
        idEntrada = null;
      });

      // Al eliminarla, el sistema descuenta del inventario lo que esa entrada
      // había sumado.
      stockDe(REPUESTO).then((stockDespues) => {
        expect(stockDespues, 'el inventario volvió a lo de antes').to.eq(stockAntes - 6);
      });
    });
  });

  afterEach(() => {
    if (idEntrada) cy.task('borrarEntrada', idEntrada);
  });
});
