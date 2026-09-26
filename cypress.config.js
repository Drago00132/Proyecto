const { defineConfig } = require('cypress');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Los datos de la base de datos se leen del mismo archivo que usa el backend
// (backend/.env), para no tener la contraseña escrita en dos sitios distintos
// y que no se puedan desincronizar. Se lee a mano, con fs, para no obligar a
// instalar dotenv en la raíz del proyecto.
function leerEnv(ruta) {
  const valores = {};
  if (!fs.existsSync(ruta)) return valores;
  for (const linea of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const corte = limpia.indexOf('=');
    if (corte === -1) continue;
    const clave = limpia.slice(0, corte).trim();
    let valor = limpia.slice(corte + 1).trim();
    const entrecomillado =
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"));
    if (entrecomillado) valor = valor.slice(1, -1);
    valores[clave] = valor;
  }
  return valores;
}

const ENV = leerEnv(path.join(__dirname, 'backend', '.env'));

const BD = {
  host: process.env.CY_DB_HOST || ENV.DB_HOST || 'localhost',
  port: Number(process.env.CY_DB_PORT || ENV.DB_PORT || 3306),
  user: process.env.CY_DB_USER || ENV.DB_USER || 'root',
  password: process.env.CY_DB_PASSWORD || ENV.DB_PASSWORD || 'JEUSarias',
  database: process.env.CY_DB_NAME || ENV.DB_NAME || 'sigat',
  multipleStatements: true,
};

// La misma salvaguarda que tienen las pruebas integradas: estas pruebas crean,
// editan y borran registros, así que solo pueden correr contra una base de
// datos de esta misma máquina, nunca contra la de producción.
const SERVIDORES_LOCALES = ['localhost', '127.0.0.1', '::1'];
if (!SERVIDORES_LOCALES.includes(String(BD.host).trim().toLowerCase())) {
  throw new Error(
    'Las pruebas automatizadas se detuvieron por seguridad.\n' +
    `El servidor de base de datos es "${BD.host}", que no es esta máquina.\n` +
    'Estas pruebas crean, editan y borran registros: solo pueden correr\n' +
    'contra una base de datos local, nunca contra la de producción.'
  );
}

async function consultar(sql, valores = []) {
  const conexion = await mysql.createConnection(BD);
  try {
    const [filas] = await conexion.query(sql, valores);
    return filas;
  } finally {
    await conexion.end();
  }
}

module.exports = defineConfig({
  // Valores que las pruebas pueden leer desde el navegador con
  // Cypress.expose(). Aquí solo va lo que no es secreto.
  //
  // Antes esto estaba dentro de e2e como `env` y se leía con Cypress.env(),
  // pero Cypress quitó Cypress.env() en la versión 16. Ahora los valores
  // públicos van en `expose` (en la raíz de la configuración, no dentro de
  // e2e) y se leen con Cypress.expose(), que sigue siendo inmediato, sin
  // .then(). Los valores sensibles irían en `env` y se leerían con cy.env().
  expose: {
    // URL del backend. Las pruebas la usan para las comprobaciones que se
    // hacen contra la API directamente (permisos por rol, códigos de estado).
    apiUrl: process.env.CY_API_URL || 'http://localhost:3100',
  },

  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    viewportWidth: 1366,
    viewportHeight: 768,
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },

    setupNodeEvents(on, config) {
      on('task', {
        // Devuelve el código de verificación en dos pasos que el sistema
        // acaba de guardar para ese correo. Evita tener que abrir el buzón.
        async codigo2FA(correo) {
          const filas = await consultar(
            'SELECT two_factor_code FROM usuarios WHERE correo_electronico = ?',
            [correo]
          );
          return filas.length ? filas[0].two_factor_code : null;
        },

        // Devuelve el token de recuperación vigente de ese correo.
        async tokenRecuperacion(correo) {
          const filas = await consultar(
            'SELECT reset_token FROM usuarios WHERE correo_electronico = ?',
            [correo]
          );
          return filas.length ? filas[0].reset_token : null;
        },

        // Vence a la fuerza el enlace de recuperación (para el caso del
        // enlace expirado, que de otro modo exigiría esperar 15 minutos).
        async vencerTokenRecuperacion(correo) {
          await consultar(
            'UPDATE usuarios SET reset_token_expira = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE correo_electronico = ?',
            [correo]
          );
          return null;
        },

        // Deja la cuenta sin intentos fallidos ni bloqueo.
        async desbloquearCuenta(correo) {
          await consultar(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
            [correo]
          );
          return null;
        },

        // Consulta libre, para comprobar en la base lo que la interfaz dice.
        async consultaBD({ sql, valores }) {
          return await consultar(sql, valores || []);
        },

        // Ejecuta sentencias sueltas (limpieza entre pruebas).
        async ejecutarBD({ sql, valores }) {
          await consultar(sql, valores || []);
          return null;
        },

        // Borra un usuario de prueba y todo lo que cuelga de él, sin pasar
        // por la interfaz. Se usa para dejar la base como estaba.
        async borrarUsuario(identidad) {
          await consultar('DELETE FROM tecnico WHERE numero_identidad = ?', [identidad]);
          await consultar('DELETE FROM usuarios WHERE numero_identidad = ?', [identidad]);
          return null;
        },

        // Devuelve la contraseña cifrada que tiene guardada ese correo, para
        // poder restaurarla después de las pruebas de recuperación.
        async hashContrasena(correo) {
          const filas = await consultar(
            'SELECT contrasena FROM usuarios WHERE correo_electronico = ?',
            [correo]
          );
          return filas.length ? filas[0].contrasena : null;
        },

        // Borra los servicios (historial) de las motos de prueba y deja el
        // contador de reparaciones del técnico de prueba en cero. Así cada
        // prueba del módulo de Servicio parte del mismo estado.
        async limpiarServicios(placas) {
          const lista = placas && placas.length ? placas : ['PRB001', 'PRB002', 'PRB003'];
          const marcas = lista.map(() => '?').join(',');
          const motos = await consultar(
            `SELECT id_motos FROM motos WHERE placa IN (${marcas})`,
            lista
          );
          for (const moto of motos) {
            await consultar(
              'DELETE rh FROM repuestos_historial rh JOIN historial h ON rh.id_historial = h.id_historial WHERE h.id_motos = ?',
              [moto.id_motos]
            );
            await consultar('DELETE FROM historial WHERE id_motos = ?', [moto.id_motos]);
          }
          await consultar(
            'UPDATE tecnico SET reparaciones_asignadas = 0 WHERE numero_identidad = ?',
            ['1900000002']
          );
          return null;
        },

        // Borra un distribuidor de prueba por su nombre, junto con las
        // entradas y las asignaciones de repuestos que colgaran de él.
        async borrarDistribuidor(nombre) {
          const filas = await consultar(
            'SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?',
            [nombre]
          );
          for (const d of filas) {
            await consultar('DELETE FROM entrada_repuestos WHERE id_distribuidor = ?', [d.id_distribuidor]);
            await consultar('DELETE FROM repuesto_distribuidor WHERE id_distribuidor = ?', [d.id_distribuidor]);
            await consultar('DELETE FROM distribuidores WHERE id_distribuidor = ?', [d.id_distribuidor]);
          }
          return null;
        },

        // Quita las asignaciones de un repuesto de prueba a cualquier
        // distribuidor, para que cada prueba parta del mismo estado.
        async limpiarAsignaciones(nombreRepuesto) {
          await consultar(
            'DELETE rd FROM repuesto_distribuidor rd JOIN repuestos r ON rd.id_repuestos = r.id_repuestos WHERE r.nombre_repuesto = ?',
            [nombreRepuesto]
          );
          return null;
        },

        // Borra una entrada de repuestos de prueba. Al borrarla, el propio
        // sistema devuelve el stock que esa entrada había sumado.
        async borrarEntrada(idEntrada) {
          await consultar('DELETE FROM entrada_repuestos WHERE id_entrada = ?', [idEntrada]);
          return null;
        },

        // Borra un rol de prueba por su nombre, devolviendo antes a Cliente a
        // cualquier usuario que hubiera quedado con ese rol.
        async borrarRol(nombre) {
          const roles = await consultar('SELECT id_rol FROM roles WHERE rol = ?', [nombre]);
          for (const rol of roles) {
            await consultar('UPDATE usuarios SET id_rol = 3 WHERE id_rol = ?', [rol.id_rol]);
            await consultar('DELETE FROM roles WHERE id_rol = ?', [rol.id_rol]);
          }
          return null;
        },

        // Borra una moto de prueba y los servicios que colgaran de ella.
        async borrarMoto(placa) {
          const motos = await consultar('SELECT id_motos FROM motos WHERE placa = ?', [placa]);
          for (const moto of motos) {
            await consultar(
              'DELETE rh FROM repuestos_historial rh JOIN historial h ON rh.id_historial = h.id_historial WHERE h.id_motos = ?',
              [moto.id_motos]
            );
            await consultar('DELETE FROM historial WHERE id_motos = ?', [moto.id_motos]);
          }
          await consultar('DELETE FROM motos WHERE placa = ?', [placa]);
          return null;
        },

        // Borra los repuestos que crean las pruebas del módulo de Repuestos.
        async borrarRepuesto(nombre) {
          await consultar(
            'DELETE rh FROM repuestos_historial rh JOIN repuestos r ON rh.id_repuestos = r.id_repuestos WHERE r.nombre_repuesto = ?',
            [nombre]
          );
          await consultar('DELETE FROM repuestos WHERE nombre_repuesto = ?', [nombre]);
          return null;
        },

        // Restaura una contraseña cifrada previamente guardada.
        async restaurarContrasena({ correo, hash }) {
          await consultar(
            'UPDATE usuarios SET contrasena = ?, reset_token = NULL, reset_token_expira = NULL WHERE correo_electronico = ?',
            [hash, correo]
          );
          return null;
        },
      });

      return config;
    },
  },
});
