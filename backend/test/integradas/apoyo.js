// Apoyo común a las pruebas integradas.
//
// Estas pruebas no usan simulacros: levantan la aplicación real (app.js, que
// se exporta sin ponerse a escuchar) y le mandan peticiones de verdad, que
// recorren la ruta, el middleware de permisos, el controlador, el modelo y la
// base de datos. Lo único que se reemplaza es el envío de correo, porque es un
// servicio de fuera del sistema: si no, cada corrida mandaría correos reales y
// las pruebas dependerían de que el servidor de correo responda.

require('dotenv').config();

const request = require('supertest');
const db = require('../../config/db');
const app = require('../../app');

// ---------------------------------------------------------------------------
//  Salvaguarda: estas pruebas crean, editan y borran registros. Antes de tocar
//  un solo dato se comprueban dos cosas, y las dos tienen que cumplirse:
//
//    1. Que el servidor de base de datos sea el de esta misma máquina. Así, se
//       llame como se llame la base, nunca pueden correr contra la base que
//       está en internet (Aiven), que es la del sistema en producción.
//
//    2. Que el archivo .env tenga escrita la línea  PRUEBAS_BD_OK=si  . Es una
//       confirmación a propósito: nadie corre estas pruebas sin saber que van
//       a escribir en esa base.
// ---------------------------------------------------------------------------
const NOMBRE_BD  = process.env.DB_NAME || '';
const SERVIDOR   = (process.env.DB_HOST || '').trim().toLowerCase();
const CONFIRMADO = (process.env.PRUEBAS_BD_OK || '').trim().toLowerCase();

const SERVIDORES_LOCALES = ['localhost', '127.0.0.1', '::1', ''];
const CONFIRMACIONES = ['si', 'sí', 'yes', 'true', '1'];

function comprobarBaseDePruebas() {
  if (!SERVIDORES_LOCALES.includes(SERVIDOR)) {
    throw new Error(
      `\n\n  Las pruebas integradas se detuvieron por seguridad.\n` +
      `  DB_HOST vale "${process.env.DB_HOST}", que no es esta máquina.\n` +
      `  Estas pruebas crean, editan y borran registros: solo pueden correr\n` +
      `  contra una base de datos local, nunca contra la de producción.\n`
    );
  }

  if (!CONFIRMADO || !CONFIRMACIONES.includes(CONFIRMADO)) {
    throw new Error(
      `\n\n  Las pruebas integradas se detuvieron por seguridad.\n` +
      `  Van a crear, editar y borrar registros en la base "${NOMBRE_BD}".\n` +
      `  Si esa es la base que quieres usar para pruebas, agrega esta línea\n` +
      `  al archivo .env de la carpeta backend:\n\n` +
      `      PRUEBAS_BD_OK=si\n`
    );
  }
}

// ---------------------------------------------------------------------------
//  Usuarios de prueba (los mismos que deja cypress/seed/datos_de_prueba.sql)
// ---------------------------------------------------------------------------
const USUARIOS = {
  cliente:            { identidad: '1900000001', correo: 'cliente.pruebas@gmail.com',    rol: 3  },
  cliente2:           { identidad: '1900000003', correo: 'cliente2.pruebas@gmail.com',   rol: 3  },
  tecnico:            { identidad: '1900000002', correo: 'tecnico.pruebas@gmail.com',    rol: 2  },
  recepcionista:      { identidad: '1900000016', correo: 'recepcion.pruebas@gmail.com',  rol: 16 },
  administrador:      { identidad: '1900000010', correo: 'admin.pruebas@gmail.com',      rol: 1  },
  administrador2:     { identidad: '1900000011', correo: 'admin2.pruebas@gmail.com',     rol: 1  },
  superadministrador: { identidad: '1900000017', correo: 'superadmin.pruebas@gmail.com', rol: 17 },
};

const CONTRASENA = 'Sigat2026!';

// ---------------------------------------------------------------------------
//  Consultas directas a la base, para comprobar que lo que dice la respuesta
//  de verdad quedó guardado.
// ---------------------------------------------------------------------------
async function consultar(sql, valores = []) {
  const [filas] = await db.query(sql, valores);
  return filas;
}

async function ejecutar(sql, valores = []) {
  await db.query(sql, valores);
}

// ---------------------------------------------------------------------------
//  Inicio de sesión. Para Administrador y Súper Administrador el sistema pide
//  un código de verificación; se lee de la base, que es donde el propio
//  sistema lo guarda antes de enviarlo por correo.
// ---------------------------------------------------------------------------
async function iniciarSesion(clave) {
  const usuario = USUARIOS[clave];
  if (!usuario) throw new Error(`No existe el usuario de prueba "${clave}"`);

  await ejecutar(
    'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
    [usuario.correo]
  );

  const respuesta = await request(app)
    .post('/api/login/login')
    .send({ correo_electronico: usuario.correo, contrasena: CONTRASENA });

  if (respuesta.status !== 200) {
    throw new Error(`No se pudo iniciar sesión como "${clave}": ${respuesta.status} ${JSON.stringify(respuesta.body)}`);
  }

  if (!respuesta.body.requiere2FA) return respuesta.body.token;

  const filas = await consultar(
    'SELECT two_factor_code FROM usuarios WHERE correo_electronico = ?',
    [usuario.correo]
  );

  const verificacion = await request(app)
    .post('/api/login/verificar-2fa')
    .send({ correo_electronico: usuario.correo, codigo: String(filas[0].two_factor_code) });

  if (verificacion.status !== 200) {
    throw new Error(`No se pudo verificar el código de "${clave}": ${verificacion.status} ${JSON.stringify(verificacion.body)}`);
  }

  return verificacion.body.token;
}

// ---------------------------------------------------------------------------
//  Atajos para hablar con la aplicación con una sesión ya iniciada.
// ---------------------------------------------------------------------------
const como = (token) => ({
  get:    (url)       => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post:   (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
  put:    (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
  delete: (url)       => request(app).delete(url).set('Authorization', `Bearer ${token}`),
});

// Peticiones sin sesión iniciada (registro público, recuperar contraseña).
const sinSesion = {
  get:  (url)       => request(app).get(url),
  post: (url, body) => request(app).post(url).send(body),
};

// ---------------------------------------------------------------------------
//  Datos desechables
// ---------------------------------------------------------------------------
function datosUsuario(identidad, idRol, etiqueta) {
  return {
    numero_identidad: String(identidad),
    tipo_documento: 'Cedula de Ciudadania',
    nombre: 'Prueba',
    apellido: 'Integrada',
    fecha_nacimiento: '1995-05-20',
    // El celular se saca del propio documento, porque la base exige que no se
    // repita entre usuarios. Con un número fijo, dos usuarios de prueba vivos
    // al mismo tiempo chocaban.
    numero_celular: '3' + String(identidad).slice(-9),
    correo_electronico: `${etiqueta}@gmail.com`,
    contrasena: CONTRASENA,
    id_rol: idRol,
  };
}

async function borrarUsuario(identidad) {
  await ejecutar('DELETE FROM tecnico WHERE numero_identidad = ?', [identidad]);
  await ejecutar('DELETE FROM usuarios WHERE numero_identidad = ?', [identidad]);
}

async function borrarMoto(placa) {
  const motos = await consultar('SELECT id_motos FROM motos WHERE placa = ?', [placa]);
  for (const moto of motos) {
    await ejecutar(
      'DELETE rh FROM repuestos_historial rh JOIN historial h ON rh.id_historial = h.id_historial WHERE h.id_motos = ?',
      [moto.id_motos]
    );
    await ejecutar('DELETE FROM historial WHERE id_motos = ?', [moto.id_motos]);
  }
  await ejecutar('DELETE FROM motos WHERE placa = ?', [placa]);
}

async function limpiarServicios(placas = ['PRB001', 'PRB002', 'PRB003']) {
  const marcas = placas.map(() => '?').join(',');
  const motos = await consultar(`SELECT id_motos FROM motos WHERE placa IN (${marcas})`, placas);
  for (const moto of motos) {
    await ejecutar(
      'DELETE rh FROM repuestos_historial rh JOIN historial h ON rh.id_historial = h.id_historial WHERE h.id_motos = ?',
      [moto.id_motos]
    );
    await ejecutar('DELETE FROM historial WHERE id_motos = ?', [moto.id_motos]);
  }
  await ejecutar('UPDATE tecnico SET reparaciones_asignadas = 0 WHERE numero_identidad = ?', [USUARIOS.tecnico.identidad]);
}

async function borrarRepuesto(nombre) {
  await ejecutar(
    'DELETE rh FROM repuestos_historial rh JOIN repuestos r ON rh.id_repuestos = r.id_repuestos WHERE r.nombre_repuesto = ?',
    [nombre]
  );
  await ejecutar('DELETE FROM repuestos WHERE nombre_repuesto = ?', [nombre]);
}

async function borrarDistribuidor(nombre) {
  const filas = await consultar('SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?', [nombre]);
  for (const d of filas) {
    await ejecutar('DELETE FROM entrada_repuestos WHERE id_distribuidor = ?', [d.id_distribuidor]);
    await ejecutar('DELETE FROM repuesto_distribuidor WHERE id_distribuidor = ?', [d.id_distribuidor]);
    await ejecutar('DELETE FROM distribuidores WHERE id_distribuidor = ?', [d.id_distribuidor]);
  }
}

async function borrarRol(nombre) {
  const roles = await consultar('SELECT id_rol FROM roles WHERE rol = ?', [nombre]);
  for (const rol of roles) {
    await ejecutar('UPDATE usuarios SET id_rol = 3 WHERE id_rol = ?', [rol.id_rol]);
    await ejecutar('DELETE FROM roles WHERE id_rol = ?', [rol.id_rol]);
  }
}

// ---------------------------------------------------------------------------
//  Identificadores de los datos de partida
// ---------------------------------------------------------------------------
async function idMoto(placa) {
  const filas = await consultar('SELECT id_motos FROM motos WHERE placa = ?', [placa]);
  if (!filas.length) throw new Error(`No existe la moto de prueba con placa ${placa}. ¿Cargaste datos_de_prueba.sql?`);
  return filas[0].id_motos;
}

async function idTecnicoPrueba() {
  const filas = await consultar('SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?', [USUARIOS.tecnico.identidad]);
  if (!filas.length) throw new Error('No existe la ficha del técnico de prueba. ¿Cargaste datos_de_prueba.sql?');
  return filas[0].id_tecnico;
}

async function idRepuesto(nombre) {
  const filas = await consultar('SELECT id_repuestos FROM repuestos WHERE nombre_repuesto = ?', [nombre]);
  if (!filas.length) throw new Error(`No existe el repuesto de prueba "${nombre}". ¿Cargaste datos_de_prueba.sql?`);
  return filas[0].id_repuestos;
}

async function idDistribuidor(nombre) {
  const filas = await consultar('SELECT id_distribuidor FROM distribuidores WHERE nombre_distribuidor = ?', [nombre]);
  if (!filas.length) throw new Error(`No existe el distribuidor de prueba "${nombre}". ¿Cargaste datos_de_prueba.sql?`);
  return filas[0].id_distribuidor;
}

/** Deja montado un servicio y devuelve su identificador. */
async function crearServicio(token, datos) {
  const respuesta = await como(token).post('/api/historial/agregar', datos);
  if (respuesta.status !== 201) {
    throw new Error(`No se pudo dejar montado el servicio de partida: ${respuesta.status} ${JSON.stringify(respuesta.body)}`);
  }
  return respuesta.body.id_historial;
}

/** Cierra el grupo de conexiones al terminar el archivo de pruebas. */
async function cerrarConexiones() {
  await db.end();
}

module.exports = {
  app,
  request,
  USUARIOS,
  CONTRASENA,
  comprobarBaseDePruebas,
  iniciarSesion,
  como,
  sinSesion,
  consultar,
  ejecutar,
  datosUsuario,
  borrarUsuario,
  borrarMoto,
  borrarRepuesto,
  borrarDistribuidor,
  borrarRol,
  limpiarServicios,
  idMoto,
  idTecnicoPrueba,
  idRepuesto,
  idDistribuidor,
  crearServicio,
  cerrarConexiones,
};
