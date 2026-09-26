// =============================================================================
//  DIAGNÓSTICO DE LAS PRUEBAS INTEGRADAS
// =============================================================================
//  Revisa, uno por uno, los requisitos que necesitan las pruebas integradas y
//  dice en español qué falta. No modifica nada: solo consulta.
//
//  Se corre así, parado en la carpeta backend:
//
//      node test/integradas/diagnostico.js
//
//  No muestra la contraseña de la base de datos en ningún momento.
// =============================================================================

require('dotenv').config({ quiet: true });

const TABLAS = [
  'usuarios', 'roles', 'motos', 'tecnico', 'historial', 'repuestos',
  'repuestos_historial', 'distribuidores', 'repuesto_distribuidor',
  'entrada_repuestos', 'repuestos_auditoria',
];

const USUARIOS_SEMILLA = [
  '1900000001', '1900000002', '1900000003',
  '1900000010', '1900000011', '1900000016', '1900000017',
];

const ok    = (t) => console.log('  [ OK ]  ' + t);
const falla = (t) => console.log('  [FALLA] ' + t);
const aviso = (t) => console.log('  [ !  ]  ' + t);

let problemas = [];

async function main() {
  console.log('\n===========================================================');
  console.log(' DIAGNÓSTICO DE LAS PRUEBAS INTEGRADAS DE SIGAT');
  console.log('===========================================================\n');

  // --- 1. El archivo .env --------------------------------------------------
  console.log('1) Configuración que está leyendo el sistema (.env)\n');
  const cfg = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
  };
  console.log('     DB_HOST      = ' + (cfg.DB_HOST || '(sin definir)'));
  console.log('     DB_PORT      = ' + (cfg.DB_PORT || '(sin definir)'));
  console.log('     DB_USER      = ' + (cfg.DB_USER || '(sin definir)'));
  console.log('     DB_PASSWORD  = ' + (process.env.DB_PASSWORD ? '(definida)' : '(vacía o sin definir)'));
  console.log('     DB_NAME      = ' + (cfg.DB_NAME || '(sin definir)'));
  console.log('     JWT_SECRET   = ' + (process.env.JWT_SECRET ? '(definida)' : '(SIN DEFINIR)'));
  console.log('     PRUEBAS_BD_OK= ' + (process.env.PRUEBAS_BD_OK || '(sin definir)'));
  console.log('     DB_SSL_CA    = ' + (process.env.DB_SSL_CA ? '(definida)' : '(sin definir)'));
  console.log('');

  if (!cfg.DB_NAME) {
    falla('DB_NAME no está definida. El archivo .env no se está leyendo o le falta esa línea.');
    problemas.push('Falta DB_NAME en el archivo .env de la carpeta backend.');
  } else {
    ok(`DB_NAME apunta a la base "${cfg.DB_NAME}".`);
  }

  // Salvaguarda 1: el servidor tiene que ser el de esta misma máquina.
  const servidor = (cfg.DB_HOST || '').trim().toLowerCase();
  if (!['localhost', '127.0.0.1', '::1', ''].includes(servidor)) {
    falla(`DB_HOST vale "${cfg.DB_HOST}", que no es esta máquina.`);
    problemas.push('Las pruebas solo corren contra una base local: pon DB_HOST=localhost. Nunca contra la base de producción.');
  } else {
    ok('El servidor es local, así que las pruebas no pueden tocar la base de producción.');
  }

  // Salvaguarda 2: confirmación explícita en el .env.
  const confirmado = (process.env.PRUEBAS_BD_OK || '').trim().toLowerCase();
  if (!['si', 'sí', 'yes', 'true', '1'].includes(confirmado)) {
    falla('Falta la confirmación PRUEBAS_BD_OK en el archivo .env.');
    problemas.push(`Agrega esta línea al .env de la carpeta backend:  PRUEBAS_BD_OK=si   (confirma que la base "${cfg.DB_NAME}" se puede usar para pruebas, porque se le crean, editan y borran registros).`);
  } else {
    ok(`Está la confirmación para escribir en "${cfg.DB_NAME}".`);
  }

  if (!process.env.JWT_SECRET) {
    falla('JWT_SECRET no está definida: sin ella el sistema no puede emitir credenciales.');
    problemas.push('Agrega JWT_SECRET al archivo .env (cualquier texto sirve para pruebas).');
  }

  // --- 2. La dependencia supertest -----------------------------------------
  console.log('\n2) Dependencias\n');
  try {
    require.resolve('supertest');
    ok('supertest está instalado.');
  } catch {
    falla('supertest NO está instalado.');
    problemas.push('Ejecuta: npm install --save-dev supertest');
  }

  let mysql;
  try {
    mysql = require('mysql2/promise');
    ok('mysql2 está instalado.');
  } catch {
    falla('mysql2 NO está instalado.');
    problemas.push('Ejecuta: npm install mysql2');
    return terminar();
  }

  // --- 3. El servidor de base de datos -------------------------------------
  console.log('\n3) Conexión con el servidor de base de datos\n');
  const datos = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  let conexion;
  try {
    conexion = await mysql.createConnection(datos);
    ok(`El servidor responde en ${datos.host}:${datos.port} y el usuario "${datos.user}" entró.`);
  } catch (e) {
    falla(`No se pudo conectar: ${e.code || ''} ${e.message}`);
    if (e.code === 'ECONNREFUSED') {
      problemas.push('El servidor MySQL no está encendido, o DB_HOST/DB_PORT no son los correctos. Enciende MySQL (o XAMPP/WAMP) y vuelve a intentar.');
    } else if (e.code === 'ER_ACCESS_DENIED_ERROR') {
      problemas.push('El usuario o la contraseña de DB_USER/DB_PASSWORD no son correctos para ese servidor.');
    } else if (e.code === 'ENOTFOUND') {
      problemas.push(`El nombre del servidor "${datos.host}" no existe. Para una base local suele ser localhost o 127.0.0.1.`);
    } else {
      problemas.push('Revisa los datos de conexión del archivo .env.');
    }
    return terminar();
  }

  // --- 3b. La conexión tal como la hace el sistema --------------------------
  //  Este paso es el importante: usa config/db.js, exactamente la misma
  //  configuración con la que se conectan las pruebas. El paso anterior solo
  //  comprueba que el servidor responda.
  console.log('\n3b) Conexión tal como la hace el sistema (config/db.js)\n');
  try {
    const db = require('../../config/db');
    await db.query('SELECT 1');
    ok('El sistema se conecta con su propia configuración.');
    await db.end();
  } catch (e) {
    falla(`El sistema NO se conecta: ${e.message}`);
    if (/secure connection|SSL|ssl/.test(e.message)) {
      console.log('');
      console.log('     El archivo .env tiene definida la variable DB_SSL_CA, que enciende');
      console.log('     la conexión cifrada. Eso lo necesita la base que está en internet');
      console.log('     (Aiven), pero un MySQL instalado en el equipo no la admite.');
      problemas.push('Comenta o borra la línea DB_SSL_CA del archivo .env mientras uses la base local. Para comentarla, ponle un # adelante:   #DB_SSL_CA=...');
    } else if (e.code === 'ER_BAD_DB_ERROR') {
      problemas.push(`La base "${process.env.DB_NAME}" no existe: corrige DB_NAME o créala.`);
    } else {
      problemas.push('Revisa los datos de conexión del archivo .env: el servidor responde, pero el sistema no logra entrar con esa configuración.');
    }
  }

  // --- 4. La base de pruebas -----------------------------------------------
  console.log('\n4) La base de datos de pruebas\n');
  const [bases] = await conexion.query('SHOW DATABASES');
  const nombres = bases.map((b) => Object.values(b)[0]);
  if (!nombres.includes(process.env.DB_NAME)) {
    falla(`La base "${process.env.DB_NAME}" no existe en ese servidor.`);
    console.log('     Bases que sí existen: ' + nombres.filter(n => !['information_schema','mysql','performance_schema','sys'].includes(n)).join(', '));
    problemas.push(`Crea la base, o corrige DB_NAME para que apunte a una de las de arriba. Para crearla: CREATE DATABASE ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conexion.end();
    return terminar();
  }
  ok(`La base "${process.env.DB_NAME}" existe.`);
  await conexion.changeUser({ database: process.env.DB_NAME });

  // --- 5. Las tablas -------------------------------------------------------
  console.log('\n5) Estructura de la base\n');
  const [tablas] = await conexion.query('SHOW TABLES');
  const hay = tablas.map((t) => Object.values(t)[0]);
  const faltan = TABLAS.filter((t) => !hay.includes(t));
  if (faltan.length) {
    falla('Faltan tablas: ' + faltan.join(', '));
    problemas.push('Carga la estructura del sistema en esa base (el respaldo .sql del proyecto) antes de los datos de prueba.');
  } else {
    ok(`Están las ${TABLAS.length} tablas del sistema.`);
  }

  const [disparadores] = await conexion.query('SHOW TRIGGERS');
  if (disparadores.length < 6) {
    aviso(`Solo hay ${disparadores.length} disparadores de los 6 del sistema. Sin ellos fallan las pruebas de inventario y la ficha automática de técnico.`);
    problemas.push('Vuelve a cargar el respaldo .sql incluyendo los disparadores (triggers).');
  } else {
    ok(`Están los ${disparadores.length} disparadores del sistema.`);
  }

  // --- 6. Los datos de prueba ----------------------------------------------
  if (!faltan.length) {
    console.log('\n6) Datos de prueba\n');

    const [usuarios] = await conexion.query(
      `SELECT numero_identidad FROM usuarios WHERE numero_identidad IN (${USUARIOS_SEMILLA.map(() => '?').join(',')})`,
      USUARIOS_SEMILLA
    );
    const encontrados = usuarios.map((u) => String(u.numero_identidad));
    const sinSembrar = USUARIOS_SEMILLA.filter((i) => !encontrados.includes(i));
    if (sinSembrar.length) {
      falla('Faltan usuarios de prueba: ' + sinSembrar.join(', '));
      problemas.push('Carga los datos de prueba: mysql -u root -p ' + process.env.DB_NAME + ' < ../cypress/seed/datos_de_prueba.sql');
    } else {
      ok('Están los 7 usuarios de prueba.');
    }

    const [motos] = await conexion.query("SELECT placa FROM motos WHERE placa IN ('PRB001','PRB002','PRB003')");
    if (motos.length < 3) {
      falla(`Faltan motos de prueba (hay ${motos.length} de 3: PRB001, PRB002, PRB003).`);
      problemas.push('Carga los datos de prueba: cypress/seed/datos_de_prueba.sql');
    } else {
      ok('Están las 3 motos de prueba.');
    }

    const [repuestos] = await conexion.query("SELECT nombre_repuesto FROM repuestos WHERE nombre_repuesto IN ('Bujia de prueba','Filtro de prueba')");
    if (repuestos.length < 2) {
      falla(`Faltan repuestos de prueba (hay ${repuestos.length} de 2).`);
      problemas.push('Carga los datos de prueba: cypress/seed/datos_de_prueba.sql');
    } else {
      ok('Están los 2 repuestos de prueba.');
    }

    const [distri] = await conexion.query("SELECT nombre_distribuidor FROM distribuidores WHERE nombre_distribuidor = 'Distribuidora de prueba'");
    if (!distri.length) {
      falla('Falta el distribuidor de prueba.');
      problemas.push('Carga los datos de prueba: cypress/seed/datos_de_prueba.sql');
    } else {
      ok('Está el distribuidor de prueba.');
    }

    const [ficha] = await conexion.query("SELECT id_tecnico FROM tecnico WHERE numero_identidad = '1900000002'");
    if (!ficha.length) {
      falla('Falta la ficha del técnico de prueba.');
      problemas.push('Carga los datos de prueba: cypress/seed/datos_de_prueba.sql');
    } else {
      ok('Está la ficha del técnico de prueba.');
    }
  }

  await conexion.end();
  terminar();
}

function terminar() {
  console.log('\n===========================================================');
  if (!problemas.length) {
    console.log(' TODO LISTO: las pruebas integradas deberían correr.');
    console.log('   npm test Cliente');
  } else {
    console.log(' QUÉ HAY QUE HACER (' + problemas.length + '):\n');
    problemas.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
  }
  console.log('===========================================================\n');
  process.exit(0);
}

main().catch((e) => {
  console.log('\n  [FALLA] El diagnóstico se detuvo con un error inesperado:');
  console.log('          ' + (e.code ? e.code + ' — ' : '') + e.message);
  terminar();
});
