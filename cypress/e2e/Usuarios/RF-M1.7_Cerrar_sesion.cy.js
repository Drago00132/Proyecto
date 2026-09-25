// RF-M1.7 — Cerrar sesión
// Casos de prueba: CP-028, CP-029

describe('RF-M1.7 — Cerrar sesión', () => {
  it('CP-028 — El usuario cierra sesión y vuelve a la pantalla de inicio de sesión', () => {
    cy.entrarComo('cliente');

    cy.cerrarSesion();

    cy.contains('h2', 'Inicio de Sesión').should('be.visible');

    // La sesión guardada en el navegador queda limpia.
    cy.window().then((ventana) => {
      expect(ventana.localStorage.getItem('token'), 'token borrado').to.be.null;
      expect(ventana.localStorage.getItem('rol'), 'rol borrado').to.be.null;
    });
  });

  it('CP-029 — Tras cerrar sesión ya no se puede volver a los datos del panel', () => {
    cy.entrarComo('cliente');
    cy.cerrarSesion();

    // Volver atrás con el botón del navegador no devuelve la sesión: la
    // credencial ya no está y el servidor rechaza cualquier consulta.
    cy.go('back');

    cy.window().then((ventana) => {
      expect(ventana.localStorage.getItem('token'), 'sigue sin token').to.be.null;
    });

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/api/usuarios/listar`,
      failOnStatusCode: false,
    }).then((respuesta) => {
      expect(respuesta.status, 'el servidor niega el acceso sin sesión').to.be.oneOf([401, 403]);
    });
  });
});
