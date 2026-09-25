// RF-M4.3 — Actualizar motocicleta
// Casos de prueba: CP-103, CP-104

describe('RF-M4.3 — Actualizar motocicleta', () => {
  const PLACA = 'PRB901';

  const limpiar = () => {
    cy.task('borrarMoto', PLACA);
  };

  beforeEach(() => {
    limpiar();
    // Se crea una moto desechable del cliente, para no alterar las de partida.
    cy.tokenApi('cliente').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/motos/agregar',
        body: {
          numero_identidad: '1900000001',
          marca_moto: 'Yamaha',
          modelo_moto: 'YBR 125',
          placa: PLACA,
        },
      }).its('status').should('eq', 201);
    });
  });

  after(() => limpiar());

  /** Abre la ventana de edición de esa moto. */
  const abrirEdicion = (placa) => {
    cy.entrarComo('cliente');
    cy.irASeccion('motos');

    cy.get('input[placeholder*="Buscar"]').clear().type(placa);
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', placa).find('button').contains('Editar').click();
    cy.contains('.modal-title', 'Editar una Moto').should('be.visible');
  };

  it('CP-103 — El cliente actualiza los datos de su motocicleta', () => {
    abrirEdicion(PLACA);

    cy.get('#moto-editar-marca').clear().type('Suzuki');
    cy.get('#moto-editar-modelo').clear().type('GN 125');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Moto actualizado correctamente');

    cy.task('consultaBD', {
      sql: 'SELECT marca_moto, modelo_moto FROM motos WHERE placa = ?',
      valores: [PLACA],
    }).then((filas) => {
      expect(filas[0].marca_moto).to.eq('Suzuki');
      expect(filas[0].modelo_moto).to.eq('GN 125');
    });
  });

  it('CP-104 — Rechaza cambiar la placa por una que ya existe', () => {
    abrirEdicion(PLACA);

    // PRB001 ya está registrada en otra moto.
    cy.get('#moto-editar-placa').clear().type('PRB001');
    cy.contains('button', 'Guardar').click();

    cy.verAviso('Ya existe un registro con esos datos');

    cy.task('consultaBD', {
      sql: 'SELECT placa FROM motos WHERE placa = ?',
      valores: [PLACA],
    }).then((filas) => {
      expect(filas, 'la moto conserva su placa').to.have.length(1);
    });
  });
});
