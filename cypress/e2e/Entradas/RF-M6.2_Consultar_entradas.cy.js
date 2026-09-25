// RF-M6.2 — Consultar entradas de repuestos
// Casos de prueba: CP-080
//
// Nota: CP-080 también existe en RF-M3.3 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M6)".

describe('RF-M6.2 — Consultar entradas de repuestos', () => {
  let idEntrada = null;

  beforeEach(() => {
    // Una entrada de partida, para que el listado tenga algo que mostrar.
    cy.idRepuesto('Bujia de prueba').then((idRepuesto) => {
      cy.task('consultaBD', {
        sql: 'SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?',
        valores: ['Distribuidora de prueba'],
      }).then((filas) => {
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/entradaRepuestos/agregar',
            body: {
              fecha_entrada: '2026-03-12',
              cantidad_ingresada: 4,
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

  it('CP-080 (M6) — El administrador consulta el listado de entradas', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('entrada de repuestos');

    cy.contains('h2', 'Entrada de Repuestos').should('be.visible');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

    // El listado dice de qué repuesto es, de qué distribuidor y quién la registró.
    cy.contains('th', 'Repuesto').should('be.visible');
    cy.contains('th', 'Distribuidor').should('be.visible');
    cy.contains('th', 'Registrado por').should('be.visible');

    // La búsqueda por id trae solo esa entrada.
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idEntrada));
    cy.contains('button', 'Buscar').click();

    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('table tbody tr', 'Bujia de prueba').should('exist');
    cy.contains('table tbody tr', 'Distribuidora de prueba').should('exist');
  });
});
