// RF-M2.2 — Consultar repuestos
// Casos de prueba: CP-049, CP-050, CP-051, CP-052

describe('RF-M2.2 — Consultar repuestos', () => {
  it('CP-049 — El técnico obtiene el listado de repuestos', () => {
    cy.tokenApi('tecnico').then((token) => {
      cy.peticionApi(token, {
        method: 'GET',
        url: '/api/repuestos/listar?page=1&limit=999999',
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200);

        const nombres = respuesta.body.repuesto.map((r) => r.nombre_repuesto);
        expect(nombres).to.include('Bujia de prueba');
        expect(nombres).to.include('Filtro de prueba');
      });
    });
  });

  it('CP-050 — Informa cuando el repuesto buscado no existe', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('repuesto');

    cy.get('input[placeholder*="Buscar"]').clear().type('repuesto que no existe');
    cy.contains('button', 'Buscar').click();

    cy.verAviso('producto no encontrado');
    cy.get('table tbody tr').should('have.length', 0);

    // El botón "resetear" devuelve el listado completo.
    cy.contains('button', 'resetear').click();
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('CP-051 — El técnico ve el listado general desde el formulario del servicio', () => {
    // El Técnico no tiene la sección de Repuestos en su menú: llega al
    // listado general a través del servicio que tiene asignado, para poder
    // registrar los repuestos que usó.
    cy.entrarComo('tecnico');
    cy.get('nav.sigat-sidebar').contains('repuesto').should('not.exist');

    cy.tokenApi('tecnico').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/repuestos/listar' })
        .then((respuesta) => {
          expect(respuesta.status, 'el listado general sí le está permitido').to.eq(200);
          expect(respuesta.body.repuesto).to.be.an('array');
        });
    });
  });

  it('CP-052 — Al técnico se le niega el detalle individual de un repuesto', () => {
    cy.idRepuesto('Bujia de prueba').then((idRepuesto) => {
      cy.tokenApi('tecnico').then((token) => {
        cy.peticionApi(token, {
          method: 'GET',
          url: `/api/repuestos/consultar/${idRepuesto}`,
        }).its('status').should('eq', 403);
      });

      // A quien administra el inventario sí se lo permite.
      cy.tokenApi('administrador').then((token) => {
        cy.peticionApi(token, {
          method: 'GET',
          url: `/api/repuestos/consultar/${idRepuesto}`,
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          expect(respuesta.body.nombre_repuesto).to.eq('Bujia de prueba');
        });
      });
    });
  });
});
