// RF-M4.2 — Consultar motocicleta
// Casos de prueba: CP-099, CP-100, CP-101, CP-102

describe('RF-M4.2 — Consultar motocicleta', () => {
  it('CP-099 — El cliente solo ve sus propias motocicletas', () => {
    cy.entrarComo('cliente');
    cy.irASeccion('motos');

    cy.contains('h2', 'Motos').should('be.visible');

    // Las suyas sí.
    cy.contains('table tbody tr', 'PRB001').should('exist');
    cy.contains('table tbody tr', 'PRB002').should('exist');
    // La del otro cliente no.
    cy.contains('table tbody tr', 'PRB003').should('not.exist');

    cy.tokenApi('cliente').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/motos/listar?limit=999999' })
        .then((respuesta) => {
          const placas = respuesta.body.motos.map((m) => m.placa);
          expect(placas).to.include('PRB001');
          expect(placas, 'no recibe las motos ajenas').to.not.include('PRB003');
        });
    });
  });

  it('CP-100 — El administrador ve todas las motocicletas', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/motos/listar?limit=999999' })
        .then((respuesta) => {
          const placas = respuesta.body.motos.map((m) => m.placa);
          expect(placas).to.include('PRB001');
          expect(placas).to.include('PRB002');
          expect(placas).to.include('PRB003');
        });
    });

    cy.entrarComo('administrador');
    cy.irASeccion('motos');

    // El administrador además ve de quién es cada moto.
    cy.contains('th', 'Numero de identidad').should('be.visible');
    cy.get('input[placeholder*="Buscar"]').clear().type('PRB003');
    cy.contains('button', 'Buscar').click();
    cy.contains('table tbody tr', 'PRB003').should('exist');
  });

  it('CP-101 — El técnico llega al listado general, pero no tiene la sección en su menú', () => {
    cy.entrarComo('tecnico');
    cy.get('nav.sigat-sidebar').contains('motos').should('not.exist');
    cy.contains('.sigat-card-opcion', 'Motos').should('not.exist');

    cy.tokenApi('tecnico').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/motos/listar?limit=999999' })
        .then((respuesta) => {
          expect(respuesta.status, 'el listado general sí le está permitido').to.eq(200);
          expect(respuesta.body.motos).to.be.an('array');
        });
    });
  });

  it('CP-102 — Al técnico se le niega el detalle individual de una motocicleta', () => {
    cy.idMoto('PRB001').then((idMoto) => {
      cy.tokenApi('tecnico').then((token) => {
        cy.peticionApi(token, {
          method: 'GET',
          url: `/api/motos/consultar/${idMoto}`,
        }).its('status').should('eq', 403);
      });

      // A quien administra las motos sí se lo permite.
      cy.tokenApi('administrador').then((token) => {
        cy.peticionApi(token, {
          method: 'GET',
          url: `/api/motos/consultar/${idMoto}`,
        }).then((respuesta) => {
          expect(respuesta.status).to.eq(200);
          expect(respuesta.body.placa).to.eq('PRB001');
        });
      });
    });
  });
});
