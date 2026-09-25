// RF-M5.5 — Gestionar repuestos por distribuidor
// Casos de prueba: CP-075, CP-076
//
// Nota: CP-075 y CP-076 también existen en RF-M3.2 y RF-M3.3 (la numeración
// vuelve a empezar en el módulo 5), por eso se marcan con "(M5)".
//
// En la plataforma web la asignación de un repuesto a un distribuidor no tiene
// formulario: el botón "Repuestos del distribuidor" solo muestra los que ya
// tiene asociados. La asignación existe únicamente en la API, así que es ahí
// donde se comprueba, y en pantalla se verifica el resultado.

describe('RF-M5.5 — Gestionar repuestos por distribuidor', () => {
  const REPUESTO = 'Bujia de prueba';
  const PRIMERO = 'Distribuidora de prueba';
  const SEGUNDO = 'Repuestos del Oeste CP076';
  let idSegundo = null;

  const limpiar = () => {
    cy.task('limpiarAsignaciones', REPUESTO);
    cy.task('borrarDistribuidor', SEGUNDO);
  };

  beforeEach(() => {
    limpiar();
    // Un segundo distribuidor, para poder reasignarle el repuesto.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/distribuidores/agregar',
        body: {
          nombre_distribuidor: SEGUNDO,
          telefono: '3002223344',
          correo: 'oeste.pruebas@gmail.com',
          direccion: 'Transversal 2 # 3-4',
          contacto: 'Jorge Contacto',
        },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(201);
        idSegundo = respuesta.body.id_distribuidor;
      });
    });
  });

  after(() => limpiar());

  /** Identificador del distribuidor de los datos de partida. */
  const idPrimero = () =>
    cy.task('consultaBD', {
      sql: 'SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?',
      valores: [PRIMERO],
    }).then((filas) => filas[0].id_distribuidor);

  it('CP-075 (M5) — El administrador asigna un repuesto a un distribuidor', () => {
    cy.idRepuesto(REPUESTO).then((idRepuesto) => {
      idPrimero().then((idDistribuidor) => {
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/repuestoDistribuidor/asignar',
            body: { id_repuestos: idRepuesto, id_distribuidor: idDistribuidor },
          }).its('status').should('eq', 200);
        });

        cy.task('consultaBD', {
          sql: 'SELECT id_distribuidor FROM repuesto_distribuidor WHERE id_repuestos = ?',
          valores: [idRepuesto],
        }).then((filas) => {
          expect(filas, 'quedó una sola asignación').to.have.length(1);
          expect(Number(filas[0].id_distribuidor)).to.eq(Number(idDistribuidor));
        });

        // En pantalla, el distribuidor ya muestra ese repuesto entre los suyos.
        cy.entrarComo('administrador');
        cy.irASeccion('distribuidores');
        cy.get('input[placeholder*="Buscar"]').clear().type(String(idDistribuidor));
        cy.contains('button', 'Buscar').click();

        cy.contains('table tbody tr', PRIMERO)
          .find('button').contains('Repuestos del distribuidor').click();

        cy.contains('.modal-title', `Repuestos de ${PRIMERO}`).should('be.visible');
        cy.contains('table tbody tr', REPUESTO).should('exist');
      });
    });
  });

  it('CP-076 (M5) — Al reasignarlo, el repuesto queda con un único distribuidor', () => {
    cy.idRepuesto(REPUESTO).then((idRepuesto) => {
      idPrimero().then((idDistribuidor) => {
        cy.tokenApi('administrador').then((token) => {
          // Primero se le asigna al distribuidor de partida...
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/repuestoDistribuidor/asignar',
            body: { id_repuestos: idRepuesto, id_distribuidor: idDistribuidor },
          }).its('status').should('eq', 200);

          // ...y después se le pasa al segundo.
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/repuestoDistribuidor/asignar',
            body: { id_repuestos: idRepuesto, id_distribuidor: idSegundo },
          }).its('status').should('eq', 200);
        });

        // No queda vinculado a dos distribuidores a la vez.
        cy.task('consultaBD', {
          sql: 'SELECT id_distribuidor FROM repuesto_distribuidor WHERE id_repuestos = ?',
          valores: [idRepuesto],
        }).then((filas) => {
          expect(filas, 'sigue habiendo una sola asignación').to.have.length(1);
          expect(Number(filas[0].id_distribuidor)).to.eq(Number(idSegundo));
        });

        // El primero ya no lo tiene entre los suyos.
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'GET',
            url: `/api/repuestoDistribuidor/consultar/${idDistribuidor}`,
          }).then((respuesta) => {
            const nombres = respuesta.body.relaciones.map((r) => r.nombre_repuesto);
            expect(nombres, 'el distribuidor anterior lo soltó').to.not.include(REPUESTO);
          });
        });

        // Y para asignar hacen falta las dos cosas: el repuesto y el
        // distribuidor. Sin alguna de ellas el sistema rechaza la operación.
        cy.tokenApi('administrador').then((token) => {
          cy.peticionApi(token, {
            method: 'POST',
            url: '/api/repuestoDistribuidor/agregar',
            body: { id_repuestos: idRepuesto, id_distribuidor: null },
          }).then((respuesta) => {
            expect(respuesta.status).to.eq(400);
            expect(respuesta.body.message).to.contain('obligatorios');
          });
        });
      });
    });
  });

});
