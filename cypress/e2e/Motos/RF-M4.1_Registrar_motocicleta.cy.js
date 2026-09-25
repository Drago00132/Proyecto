// RF-M4.1 — Registrar motocicleta
// Casos de prueba: CP-096, CP-097, CP-098

describe('RF-M4.1 — Registrar motocicleta', () => {
  const PLACA_NUEVA = 'PRB900';

  const limpiar = () => {
    cy.task('borrarMoto', PLACA_NUEVA);
  };

  beforeEach(() => limpiar());
  after(() => limpiar());

  it('CP-096 — El cliente registra su propia motocicleta', () => {
    cy.entrarComo('cliente');
    cy.irASeccion('motos');

    cy.contains('button', 'Agregar Motos').click();
    cy.contains('.modal-title', 'Agregar Nueva Moto').should('be.visible');

    // Al cliente no se le pregunta de quién es la moto: queda a su nombre.
    cy.get('#moto-agregar-identidad').should('not.exist');
    cy.get('#moto-agregar-marca').type('Bajaj');
    cy.get('#moto-agregar-modelo').type('Pulsar NS 160');
    cy.get('#moto-agregar-placa').type(PLACA_NUEVA);
    cy.contains('button', 'Agregar').click();

    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad, marca_moto, modelo_moto FROM motos WHERE placa = ?',
      valores: [PLACA_NUEVA],
    }).then((filas) => {
      expect(filas, 'la moto quedó registrada').to.have.length(1);
      expect(String(filas[0].numero_identidad)).to.eq('1900000001');
      expect(filas[0].marca_moto).to.eq('Bajaj');
    });
  });

  it('CP-097 — Rechaza una placa que ya está registrada', () => {
    cy.entrarComo('cliente');
    cy.irASeccion('motos');

    cy.contains('button', 'Agregar Motos').click();
    // PRB001 ya viene cargada con los datos de partida.
    cy.get('#moto-agregar-marca').type('Bajaj');
    cy.get('#moto-agregar-modelo').type('Pulsar NS 160');
    cy.get('#moto-agregar-placa').type('PRB001');
    cy.contains('button', 'Agregar').click();

    cy.verAviso('Ya existe un registro con esos datos');

    cy.task('consultaBD', {
      sql: 'SELECT COUNT(*) AS total FROM motos WHERE placa = ?',
      valores: ['PRB001'],
    }).then((filas) => {
      expect(Number(filas[0].total), 'sigue habiendo una sola moto con esa placa').to.eq(1);
    });
  });

  it('CP-098 — El recepcionista registra la motocicleta a nombre del cliente', () => {
    cy.entrarComo('recepcionista');
    cy.irASeccion('motos');

    cy.contains('button', 'Agregar Motos').click();

    // El recepcionista sí elige el dueño de la moto.
    cy.get('#moto-agregar-identidad').select('1900000001');
    cy.get('#moto-agregar-marca').type('Kawasaki');
    cy.get('#moto-agregar-modelo').type('Rouser NS 200');
    cy.get('#moto-agregar-placa').type(PLACA_NUEVA);
    cy.contains('button', 'Agregar').click();

    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM motos WHERE placa = ?',
      valores: [PLACA_NUEVA],
    }).then((filas) => {
      expect(filas).to.have.length(1);
      expect(String(filas[0].numero_identidad), 'quedó a nombre del cliente').to.eq('1900000001');
    });
  });
});
