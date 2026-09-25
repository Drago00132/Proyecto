// RF-M1.6 — Eliminar cuenta de usuario
// Casos de prueba: CP-024, CP-025, CP-026, CP-027

describe('RF-M1.6 — Eliminar cuenta de usuario', () => {
  const IDENTIDAD_DESECHABLE = '1900000802';

  beforeEach(() => {
    cy.fixture('usuarios').as('usuarios');
  });

  after(() => {
    cy.task('borrarUsuario', IDENTIDAD_DESECHABLE);
  });

  it('CP-024 — El administrador elimina una cuenta desde la pantalla de usuarios', () => {
    // Se crea un cliente desechable para no borrar los usuarios base.
    cy.task('borrarUsuario', IDENTIDAD_DESECHABLE);
    cy.tokenApi('administrador').then((token) => {
      cy.datosUsuario(IDENTIDAD_DESECHABLE, 3, 'cp024.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });
    });

    cy.entrarComo('administrador');
    cy.irASeccion('usuarios');

    cy.get('input[placeholder*="Buscar"]').clear().type(IDENTIDAD_DESECHABLE);
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', IDENTIDAD_DESECHABLE)
      .find('button')
      .contains('Eliminar')
      .click();

    cy.contains('seguro que quieres eliminar').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('usuario eliminado');

    // La cuenta ya no existe en la base.
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: [IDENTIDAD_DESECHABLE],
    }).then((filas) => {
      expect(filas).to.have.length(0);
    });
  });

  it('CP-025 — Informa que la cuenta no existe', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: '/api/usuarios/eliminar/1999999999',
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(404);
        expect(respuesta.body.message).to.contain('no encontrado');
      });
    });
  });

  it('CP-026 — El propio usuario no puede eliminar su cuenta por su cuenta', function () {
    // En el sistema la eliminación de cuentas es una acción reservada al
    // Administrador y al Super Administrador: el Cliente que intenta borrar
    // su propia cuenta recibe una negación del servidor.
    const u = this.usuarios.cliente;

    cy.tokenApi('cliente').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: `/api/usuarios/eliminar/${u.numero_identidad}`,
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(403);
      });
    });

    // La cuenta sigue existiendo.
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: [u.numero_identidad],
    }).then((filas) => {
      expect(filas).to.have.length(1);
    });
  });

  it('CP-027 — Un administrador no puede eliminar a otro administrador', function () {
    const otroAdmin = this.usuarios.administrador2;

    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'DELETE',
        url: `/api/usuarios/eliminar/${otroAdmin.numero_identidad}`,
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(403);
        expect(respuesta.body.message).to.contain('No tienes permiso');
      });
    });

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: [otroAdmin.numero_identidad],
    }).then((filas) => {
      expect(filas, 'la otra cuenta de administrador sigue existiendo').to.have.length(1);
    });
  });
});
