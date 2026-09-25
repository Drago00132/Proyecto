// RF-M1.3 — Recuperar contraseña mediante correo electrónico
// Casos de prueba: CP-010, CP-011, CP-012, CP-013

describe('RF-M1.3 — Recuperar contraseña mediante correo electrónico', () => {
  let hashOriginal = null;

  before(function () {
    // Se guarda la contraseña cifrada del usuario de prueba para poder
    // dejarla como estaba al terminar el archivo.
    cy.fixture('usuarios').then((usuarios) => {
      cy.task('hashContrasena', usuarios.cliente.correo).then((hash) => {
        hashOriginal = hash;
      });
    });
  });

  after(function () {
    cy.fixture('usuarios').then((usuarios) => {
      if (hashOriginal) {
        cy.task('restaurarContrasena', { correo: usuarios.cliente.correo, hash: hashOriginal });
      }
    });
  });

  beforeEach(() => {
    cy.fixture('usuarios').as('usuarios');
  });

  it('CP-010 — Un usuario registrado recupera su contraseña y entra con la nueva', function () {
    const u = this.usuarios.cliente;
    const nueva = 'NuevaClave2026!';

    // 1. Solicitar el enlace de recuperación.
    cy.visit('/recuperar-contrasena');
    cy.get('#recuperar-correo').clear().type(u.correo);
    cy.contains('button', 'Enviar enlace').click();
    cy.verAviso('enlace de recuperación');

    // 2. Abrir el enlace con el token que el sistema acaba de generar.
    cy.task('tokenRecuperacion', u.correo).then((token) => {
      expect(token, 'token de recuperación guardado en la base').to.not.be.null;

      cy.visit(`/restablecer-contrasena?token=${token}`);
      cy.get('#restablecer-nueva-contrasena').clear().type(nueva, { log: false });
      cy.get('#restablecer-confirmar-contrasena').clear().type(nueva, { log: false });
      cy.contains('button', 'Restablecer contraseña').click();

      cy.verAviso('Contraseña actualizada correctamente');
    });

    // 3. La nueva contraseña sirve para iniciar sesión.
    cy.task('desbloquearCuenta', u.correo);
    cy.iniciarSesion(u.correo, nueva);
    cy.url().should('include', '/panel');
  });

  it('CP-011 — Informa que el correo no está registrado', () => {
    cy.visit('/recuperar-contrasena');
    cy.get('#recuperar-correo').clear().type('no.existe.pruebas@gmail.com');
    cy.contains('button', 'Enviar enlace').click();

    cy.verAviso('No existe una cuenta asociada a ese correo');
  });

  it('CP-012 — Rechaza un enlace de recuperación ya vencido', function () {
    const u = this.usuarios.cliente;

    cy.visit('/recuperar-contrasena');
    cy.get('#recuperar-correo').clear().type(u.correo);
    cy.contains('button', 'Enviar enlace').click();
    cy.verAviso('enlace de recuperación');

    cy.task('tokenRecuperacion', u.correo).then((token) => {
      // Se adelanta el vencimiento para no tener que esperar los 15 minutos.
      cy.task('vencerTokenRecuperacion', u.correo);

      cy.visit(`/restablecer-contrasena?token=${token}`);
      cy.get('#restablecer-nueva-contrasena').clear().type('OtraClave2026!', { log: false });
      cy.get('#restablecer-confirmar-contrasena').clear().type('OtraClave2026!', { log: false });
      cy.contains('button', 'Restablecer contraseña').click();

      cy.verAviso('expiró');
    });
  });

  it('CP-013 — Mantiene deshabilitado el botón mientras las contraseñas no coinciden', function () {
    const u = this.usuarios.cliente;

    cy.visit('/recuperar-contrasena');
    cy.get('#recuperar-correo').clear().type(u.correo);
    cy.contains('button', 'Enviar enlace').click();
    cy.verAviso('enlace de recuperación');

    cy.task('tokenRecuperacion', u.correo).then((token) => {
      cy.visit(`/restablecer-contrasena?token=${token}`);

      cy.get('#restablecer-nueva-contrasena').clear().type('ClaveUno2026!', { log: false });
      cy.get('#restablecer-confirmar-contrasena').clear().type('ClaveDos2026!', { log: false });

      cy.contains('Las contraseñas no coinciden').should('be.visible');
      cy.contains('button', 'Restablecer contraseña').should('be.disabled');

      // Al corregir la confirmación el botón se habilita.
      cy.get('#restablecer-confirmar-contrasena').clear().type('ClaveUno2026!', { log: false });
      cy.contains('button', 'Restablecer contraseña').should('not.be.disabled');
    });
  });
});
