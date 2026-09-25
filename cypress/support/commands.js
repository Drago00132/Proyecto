// Comandos reutilizables para las pruebas automatizadas de SIGAT.

/**
 * Diligencia el formulario de inicio de sesión y lo envía.
 * No comprueba el resultado: eso lo hace cada prueba.
 */
Cypress.Commands.add('iniciarSesion', (usuario, contrasena) => {
  cy.visit('/');
  cy.get('#login-usuario').clear().type(usuario);
  cy.get('#login-contrasena').clear().type(contrasena, { log: false });
  cy.contains('button', 'Iniciar sesión').click();
});

/**
 * Inicia sesión con uno de los usuarios de prueba y deja la sesión abierta
 * en el panel. Para Administrador y Súper Administrador resuelve además la
 * verificación en dos pasos leyendo el código desde la base de pruebas.
 */
Cypress.Commands.add('entrarComo', (clave) => {
  cy.fixture('usuarios').then((usuarios) => {
    const u = usuarios[clave];
    expect(u, `usuario de prueba "${clave}"`).to.exist;

    cy.task('desbloquearCuenta', u.correo);
    cy.iniciarSesion(u.correo, u.contrasena);

    if (u.requiere2FA) {
      cy.contains('Verificación en dos pasos').should('be.visible');
      cy.task('codigo2FA', u.correo).then((codigo) => {
        expect(codigo, 'código de verificación guardado en la base').to.not.be.null;
        cy.get('#login-codigo-verificacion').clear().type(String(codigo));
        cy.contains('button', 'Verificar código').click();
      });
    }

    cy.url().should('include', '/panel');
  });
});

/** Abre una sección del panel desde el menú lateral. */
Cypress.Commands.add('irASeccion', (texto) => {
  cy.get('a.nav-link').contains(new RegExp(`^\\s*${texto}\\s*$`, 'i')).click();
});

/** Comprueba que apareció un aviso (toast) que contiene ese texto. */
Cypress.Commands.add('verAviso', (texto) => {
  cy.contains('.Toastify__toast', texto, { timeout: 12000 }).should('be.visible');
});

/** Cierra la sesión desde el menú lateral. */
Cypress.Commands.add('cerrarSesion', () => {
  cy.contains('a.nav-link', 'Cerrar Sesión').click();
  cy.url().should('not.include', '/panel');
});

/**
 * Obtiene un token de sesión llamando directamente a la API, sin pasar por
 * la interfaz. Sirve para las comprobaciones de permisos, donde lo que se
 * verifica es la respuesta del servidor y no la pantalla. Para los roles
 * con verificación en dos pasos resuelve el código desde la base.
 */
Cypress.Commands.add('tokenApi', (clave) => {
  const api = Cypress.env('apiUrl');

  return cy.fixture('usuarios').then((usuarios) => {
    const u = usuarios[clave];
    expect(u, `usuario de prueba "${clave}"`).to.exist;

    return cy.task('desbloquearCuenta', u.correo).then(() =>
      cy.request({
        method: 'POST',
        url: `${api}/api/login/login`,
        body: { correo_electronico: u.correo, contrasena: u.contrasena },
      }).then((respuesta) => {
        if (!respuesta.body.requiere2FA) {
          return respuesta.body.token;
        }
        return cy.task('codigo2FA', u.correo).then((codigo) =>
          cy.request({
            method: 'POST',
            url: `${api}/api/login/verificar-2fa`,
            body: { correo_electronico: u.correo, codigo: String(codigo) },
          }).then((r2) => r2.body.token)
        );
      })
    );
  });
});

/**
 * Llama a la API con un token, sin que Cypress falle por un código de
 * error: cada prueba decide qué código espera.
 */
Cypress.Commands.add('peticionApi', (token, opciones) => {
  return cy.request({
    failOnStatusCode: false,
    ...opciones,
    url: `${Cypress.env('apiUrl')}${opciones.url}`,
    headers: { Authorization: `Bearer ${token}`, ...(opciones.headers || {}) },
  });
});

/** Datos válidos para crear un usuario de prueba desechable. */
Cypress.Commands.add('datosUsuario', (identidad, idRol, etiqueta) => {
  return cy.wrap({
    numero_identidad: String(identidad),
    tipo_documento: 'Cedula de Ciudadania',
    nombre: 'Prueba',
    apellido: 'Automatica',
    fecha_nacimiento: '1995-05-20',
    numero_celular: '3001234567',
    correo_electronico: `${etiqueta}@gmail.com`,
    contrasena: 'Sigat2026!',
    id_rol: idRol,
  }, { log: false });
});

/** Devuelve el identificador interno de una moto de prueba por su placa. */
Cypress.Commands.add('idMoto', (placa) => {
  return cy.task('consultaBD', {
    sql: 'SELECT id_motos FROM motos WHERE placa = ?',
    valores: [placa],
  }).then((filas) => {
    expect(filas, `moto de prueba con placa ${placa}`).to.have.length(1);
    return filas[0].id_motos;
  });
});

/** Devuelve el identificador de la ficha del técnico de prueba. */
Cypress.Commands.add('idTecnicoPrueba', () => {
  return cy.task('consultaBD', {
    sql: 'SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?',
    valores: ['1900000002'],
  }).then((filas) => {
    expect(filas, 'ficha del técnico de prueba').to.have.length(1);
    return filas[0].id_tecnico;
  });
});

/** Devuelve el identificador de un repuesto de prueba por su nombre. */
Cypress.Commands.add('idRepuesto', (nombre) => {
  return cy.task('consultaBD', {
    sql: 'SELECT id_repuestos FROM repuestos WHERE nombre_repuesto = ?',
    valores: [nombre],
  }).then((filas) => {
    expect(filas, `repuesto de prueba "${nombre}"`).to.have.length(1);
    return filas[0].id_repuestos;
  });
});

/**
 * Crea un servicio (historial) llamando a la API, para dejar montado el
 * escenario que la prueba va a revisar en pantalla.
 */
Cypress.Commands.add('crearServicio', (token, datos) => {
  return cy.peticionApi(token, {
    method: 'POST',
    url: '/api/historial/agregar',
    body: datos,
  }).then((respuesta) => {
    expect(respuesta.status, 'servicio de partida creado').to.eq(201);
    return respuesta.body.id_historial;
  });
});
