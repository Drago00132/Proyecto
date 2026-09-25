// RF-M5.3 — Editar distribuidor
// Casos de prueba: CP-073
//
// Nota: CP-073 también existe en RF-M3.2 (la numeración vuelve a empezar en el
// módulo 5), por eso se marca con "(M5)".

describe('RF-M5.3 — Editar distribuidor', () => {
  const NOMBRE = 'Repuestos del Sur CP073';
  let idDistribuidor = null;

  const limpiar = () => {
    cy.task('borrarDistribuidor', NOMBRE);
  };

  beforeEach(() => {
    limpiar();
    // Se crea el distribuidor que la prueba va a editar.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/distribuidores/agregar',
        body: {
          nombre_distribuidor: NOMBRE,
          telefono: '3001112233',
          correo: 'sur.pruebas@gmail.com',
          direccion: 'Calle 5 # 6-7',
          contacto: 'Ana Contacto',
        },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(201);
        idDistribuidor = respuesta.body.id_distribuidor;
      });
    });
  });

  after(() => limpiar());

  it('CP-073 (M5) — El administrador actualiza los datos de un distribuidor', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('distribuidores');

    // El listado viene paginado, así que se ubica por su identificador.
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idDistribuidor));
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', NOMBRE).find('button').contains('Editar').click();
    cy.contains('.modal-title', 'Editar Distribuidor').should('be.visible');

    cy.get('#distribuidor-editar-telefono').clear().type('3009998877');
    cy.get('#distribuidor-editar-direccion').clear().type('Avenida 30 # 40-50');
    cy.get('#distribuidor-editar-contacto').clear().type('Pedro Contacto');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Distribuidor actualizado correctamente');

    cy.task('consultaBD', {
      sql: 'SELECT nombre_distribuidor, telefono, direccion, contacto FROM distribuidores WHERE id_distribuidor = ?',
      valores: [idDistribuidor],
    }).then((filas) => {
      expect(String(filas[0].telefono)).to.eq('3009998877');
      expect(filas[0].direccion).to.eq('Avenida 30 # 40-50');
      expect(filas[0].contacto).to.eq('Pedro Contacto');
      expect(filas[0].nombre_distribuidor, 'el nombre no cambió').to.eq(NOMBRE);
    });
  });
});
