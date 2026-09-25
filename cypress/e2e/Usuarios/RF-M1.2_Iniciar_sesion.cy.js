// RF-M1.2 — Iniciar sesión
// Casos de prueba: CP-006, CP-007, CP-008, CP-009

describe('RF-M1.2 — Iniciar sesión', () => {
  beforeEach(() => {
    cy.fixture('usuarios').as('usuarios');
  });

  it('CP-006 — Un usuario registrado inicia sesión y llega al panel', function () {
    const u = this.usuarios.cliente;
    cy.task('desbloquearCuenta', u.correo);
    cy.iniciarSesion(u.correo, u.contrasena);

    cy.url().should('include', '/panel');
    cy.contains('Bienvenido').should('be.visible');
  });

  it('CP-007 — Rechaza el ingreso con un correo que no existe', () => {
    cy.iniciarSesion('no.existe.pruebas@gmail.com', 'Sigat2026!');

    cy.verAviso('Usuario no encontrado');
    cy.url().should('not.include', '/panel');
  });

  it('CP-008 — Rechaza la contraseña incorrecta e informa los intentos restantes', function () {
    const u = this.usuarios.cliente;
    cy.task('desbloquearCuenta', u.correo);
    cy.iniciarSesion(u.correo, 'ClaveMala123');

    cy.verAviso('Contraseña incorrecta');
    cy.url().should('not.include', '/panel');

    // El contador de intentos fallidos debe haber subido a 1.
    cy.task('consultaBD', {
      sql: 'SELECT intentos_fallidos FROM usuarios WHERE correo_electronico = ?',
      valores: [u.correo],
    }).then((filas) => {
      expect(Number(filas[0].intentos_fallidos)).to.eq(1);
    });
  });

  it('CP-009 — Bloquea la cuenta al llegar al quinto intento fallido', function () {
    const u = this.usuarios.cliente;
    cy.task('desbloquearCuenta', u.correo);

    for (let intento = 1; intento <= 5; intento += 1) {
      cy.iniciarSesion(u.correo, 'ClaveMala123');
      cy.wait(400);
    }

    cy.verAviso('Cuenta bloqueada');

    cy.task('consultaBD', {
      sql: 'SELECT bloqueado_hasta FROM usuarios WHERE correo_electronico = ?',
      valores: [u.correo],
    }).then((filas) => {
      expect(filas[0].bloqueado_hasta, 'la cuenta queda con fecha de bloqueo').to.not.be.null;
    });

    cy.task('desbloquearCuenta', u.correo);
  });
});
