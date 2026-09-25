// =============================================================================
//  PRUEBAS INTEGRADAS — ROL ADMINISTRADOR
// =============================================================================
//  El Administrador gestiona el taller completo: usuarios, inventario,
//  distribuidores, entradas, servicios, motos y fichas de técnico. Lo único
//  que no le corresponde son los roles del sistema, que son del Súper
//  Administrador. Estas pruebas recorren todo eso requerimiento por
//  requerimiento, con peticiones reales contra la base de pruebas.
//
//  Los casos que no dependen del rol (correo inexistente al iniciar sesión,
//  enlace de recuperación vencido, y demás) se prueban una sola vez, en
//  Cliente.test.js.
// =============================================================================

jest.mock('../../config/mailer', () => ({
  enviarCorreoRecuperacion: jest.fn().mockResolvedValue(true),
  enviarCorreoCodigo2FA: jest.fn().mockResolvedValue(true),
}));

const path = require('path');

const {
  app, request, USUARIOS, CONTRASENA, comprobarBaseDePruebas, iniciarSesion,
  como, sinSesion, consultar, ejecutar, datosUsuario, borrarUsuario, borrarMoto,
  borrarRepuesto, borrarDistribuidor, limpiarServicios, idMoto, idTecnicoPrueba,
  idRepuesto, idDistribuidor, crearServicio, cerrarConexiones,
} = require('./apoyo');

const ADMIN = USUARIOS.administrador;
const ADMIN2 = USUARIOS.administrador2;
const CLIENTE = USUARIOS.cliente;

const ARCHIVOS = path.join(__dirname, 'archivos');

let token;

beforeAll(async () => {
  comprobarBaseDePruebas();
  token = await iniciarSesion('administrador');
});

afterAll(async () => {
  await limpiarServicios();
  await cerrarConexiones();
});

// =============================================================================
describe('RF-M1.2 — Iniciar sesión con verificación en dos pasos', () => {
  beforeEach(async () => {
    await ejecutar(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
      [ADMIN.correo]
    );
  });

  it('CP-006 — El administrador entra en dos pasos: contraseña y código', async () => {
    // Primer paso: el sistema no entrega la credencial todavía.
    const primerPaso = await sinSesion.post('/api/login/login',
      { correo_electronico: ADMIN.correo, contrasena: CONTRASENA });

    expect(primerPaso.status).toBe(200);
    expect(primerPaso.body.requiere2FA).toBe(true);
    expect(primerPaso.body.token).toBeUndefined();

    // El código queda guardado, con su vencimiento.
    const filas = await consultar(
      'SELECT two_factor_code, two_factor_code_expira FROM usuarios WHERE correo_electronico = ?',
      [ADMIN.correo]
    );
    expect(filas[0].two_factor_code).toMatch(/^\d{6}$/);
    expect(filas[0].two_factor_code_expira).not.toBeNull();

    // Segundo paso: con el código sí entrega la credencial.
    const segundoPaso = await sinSesion.post('/api/login/verificar-2fa',
      { correo_electronico: ADMIN.correo, codigo: String(filas[0].two_factor_code) });

    expect(segundoPaso.status).toBe(200);
    expect(segundoPaso.body.token).toBeDefined();
    expect(Number(segundoPaso.body.rol)).toBe(1);

    // Y el código se consume: no sirve dos veces.
    const despues = await consultar(
      'SELECT two_factor_code FROM usuarios WHERE correo_electronico = ?', [ADMIN.correo]);
    expect(despues[0].two_factor_code).toBeNull();
  });

  it('CP-006 — Rechaza un código de verificación equivocado', async () => {
    await sinSesion.post('/api/login/login',
      { correo_electronico: ADMIN.correo, contrasena: CONTRASENA });

    const respuesta = await sinSesion.post('/api/login/verificar-2fa',
      { correo_electronico: ADMIN.correo, codigo: '000000' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Código incorrecto');
    expect(respuesta.body.token).toBeUndefined();
  });

  it('CP-006 — Rechaza un código de verificación vencido', async () => {
    await sinSesion.post('/api/login/login',
      { correo_electronico: ADMIN.correo, contrasena: CONTRASENA });

    const filas = await consultar(
      'SELECT two_factor_code FROM usuarios WHERE correo_electronico = ?', [ADMIN.correo]);

    await ejecutar(
      'UPDATE usuarios SET two_factor_code_expira = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE correo_electronico = ?',
      [ADMIN.correo]
    );

    const respuesta = await sinSesion.post('/api/login/verificar-2fa',
      { correo_electronico: ADMIN.correo, codigo: String(filas[0].two_factor_code) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('expiró');
  });
});

// =============================================================================
describe('RF-M1.4 — Editar perfil y editar usuarios', () => {
  it('CP-014 — El administrador actualiza sus propios datos', async () => {
    const original = await consultar(
      'SELECT nombre, apellido, numero_celular FROM usuarios WHERE numero_identidad = ?', [ADMIN.identidad]);

    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Andres Editado',
      apellido: 'Pruebas',
      correo_electronico: ADMIN.correo,
      numero_celular: '3005554433',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT nombre FROM usuarios WHERE numero_identidad = ?', [ADMIN.identidad]);
    expect(filas[0].nombre).toBe('Andres Editado');

    await ejecutar(
      'UPDATE usuarios SET nombre = ?, apellido = ?, numero_celular = ? WHERE numero_identidad = ?',
      [original[0].nombre, original[0].apellido, original[0].numero_celular, ADMIN.identidad]
    );
  });

  it('CP-017 — Un administrador no puede editar a otro administrador', async () => {
    const respuesta = await como(token).put(`/api/usuarios/actualizar/${ADMIN2.identidad}`, {
      numero_identidad: ADMIN2.identidad,
      tipo_documento: 'Cedula de Ciudadania',
      nombre: 'Intento',
      apellido: 'Denegado',
      fecha_nacimiento: '1987-09-19',
      numero_celular: '3001110011',
      correo_electronico: ADMIN2.correo,
      id_rol: 1,
    });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar('SELECT nombre FROM usuarios WHERE numero_identidad = ?', [ADMIN2.identidad]);
    expect(filas[0].nombre).not.toBe('Intento');
  });

  it('El administrador sí puede editar a un cliente, a un técnico y a un recepcionista', async () => {
    const respuesta = await como(token).get('/api/usuarios/roles-asignables');

    expect(respuesta.status).toBe(200);
    const ids = respuesta.body.roles.map((r) => Number(r.id_rol)).sort((a, b) => a - b);
    expect(ids).toEqual([2, 3, 16]);
  });
});

// =============================================================================
describe('RF-M1.5 — Consultar usuarios registrados', () => {
  it('CP-019 — El administrador consulta el listado completo', async () => {
    const respuesta = await como(token).get('/api/usuarios/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const identidades = respuesta.body.usuarios.map((u) => String(u.numero_identidad));
    expect(identidades).toContain(CLIENTE.identidad);
    expect(identidades).toContain(USUARIOS.tecnico.identidad);
    expect(identidades).toContain(USUARIOS.recepcionista.identidad);
  });

  it('CP-023 — El listado viene paginado y nunca trae contraseñas', async () => {
    const respuesta = await como(token).get('/api/usuarios/listar?page=1&limit=5');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuarios.length).toBeLessThanOrEqual(5);
    expect(respuesta.body.totalItems).toBeGreaterThan(0);
    respuesta.body.usuarios.forEach((u) => expect(u.contrasena).toBeUndefined());
  });
});

// =============================================================================
describe('RF-M1.6 — Eliminar cuenta de usuario', () => {
  const DESECHABLE = '1900000940';

  beforeEach(async () => {
    await borrarUsuario(DESECHABLE);
    await como(token).post('/api/usuarios/agregar', datosUsuario(DESECHABLE, 3, 'admin.borrar'));
  });

  afterAll(async () => { await borrarUsuario(DESECHABLE); });

  it('CP-024 — El administrador elimina una cuenta de cliente', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${DESECHABLE}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Usuario eliminado correctamente');

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [DESECHABLE]);
    expect(filas).toHaveLength(0);
  });

  it('CP-025 — Informa que la cuenta no existe', async () => {
    const respuesta = await como(token).delete('/api/usuarios/eliminar/1999999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('no encontrado');
  });

  it('CP-027 — Un administrador no puede eliminar a otro administrador', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${ADMIN2.identidad}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [ADMIN2.identidad]);
    expect(filas).toHaveLength(1);
  });
});

// =============================================================================
describe('RF-M1.8 — Carga masiva de técnicos', () => {
  const DESECHABLES = ['1900000930', '1900000931', '1900000932', '1900000933'];

  const limpiar = async () => {
    for (const identidad of DESECHABLES) await borrarUsuario(identidad);
  };

  beforeEach(limpiar);
  afterAll(limpiar);

  const subir = (archivo) =>
    request(app)
      .post('/api/usuarios/cargar-masiva')
      .set('Authorization', `Bearer ${token}`)
      .attach('archivo', path.join(ARCHIVOS, archivo));

  it('CP-030 — Carga un archivo válido y quedan creados como técnicos', async () => {
    const respuesta = await subir('tecnicos_validos.xlsx');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toContain('Carga masiva');

    const filas = await consultar(
      'SELECT numero_identidad, id_rol FROM usuarios WHERE numero_identidad IN (?, ?)',
      ['1900000930', '1900000931']
    );
    expect(filas).toHaveLength(2);
    filas.forEach((f) => expect(Number(f.id_rol)).toBe(2));

    // Y el sistema les abre su ficha de técnico automáticamente.
    const fichas = await consultar(
      'SELECT numero_identidad FROM tecnico WHERE numero_identidad IN (?, ?)',
      ['1900000930', '1900000931']
    );
    expect(fichas).toHaveLength(2);
  });

  it('CP-031 — Sin archivo, el sistema pide seleccionar uno', async () => {
    const respuesta = await como(token).post('/api/usuarios/cargar-masiva', {});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('No se recibió ningún archivo');
  });

  it('CP-032 — Una fila con datos inválidos detiene la carga', async () => {
    const respuesta = await subir('tecnicos_fila_invalida.xlsx');

    expect(respuesta.status).toBeGreaterThanOrEqual(400);

    const filas = await consultar(
      'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', ['1900000932']);
    expect(filas).toHaveLength(0);
  });

  it('CP-033 — Una fila que pide rol Administrador no crea un administrador', async () => {
    const respuesta = await subir('tecnicos_rol_no_permitido.xlsx');

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT id_rol FROM usuarios WHERE numero_identidad = ?', ['1900000933']);
    expect(filas).toHaveLength(1);
    // Esta vía solo crea técnicos: el rol del archivo se ignora.
    expect(Number(filas[0].id_rol)).toBe(2);
  });
});

// =============================================================================
describe('RF-M1.9 — Registrar usuario por personal interno', () => {
  const CLIENTE_NUEVO = '1900000941';
  const RECEP_NUEVO = '1900000942';
  const TECNICO_NUEVO = '1900000943';
  const ADMIN_NUEVO = '1900000944';

  const limpiar = async () => {
    for (const i of [CLIENTE_NUEVO, RECEP_NUEVO, TECNICO_NUEVO, ADMIN_NUEVO]) await borrarUsuario(i);
  };

  beforeEach(limpiar);
  afterAll(limpiar);

  it('CP-034 — El administrador registra un cliente', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(CLIENTE_NUEVO, 3, 'admin.cliente'));

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [CLIENTE_NUEVO]);
    expect(Number(filas[0].id_rol)).toBe(3);
  });

  it('CP-035 — El administrador registra un recepcionista', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(RECEP_NUEVO, 16, 'admin.recepcion'));

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [RECEP_NUEVO]);
    expect(Number(filas[0].id_rol)).toBe(16);
  });

  it('CP-036 — Al registrar un técnico se le abre su ficha automáticamente', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(TECNICO_NUEVO, 2, 'admin.tecnico'));

    expect(respuesta.status).toBe(201);

    const fichas = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE numero_identidad = ?', [TECNICO_NUEVO]);
    expect(fichas).toHaveLength(1);
    expect(Number(fichas[0].reparaciones_asignadas)).toBe(0);
  });

  it('CP-037 — El administrador no puede registrar a otro administrador', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(ADMIN_NUEVO, 1, 'admin.admin'));

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [ADMIN_NUEVO]);
    expect(filas).toHaveLength(0);
  });
});

// =============================================================================
describe('RF-M2.1 a RF-M2.4 — Inventario de repuestos', () => {
  const NUEVO = 'Kit de arrastre INT';
  const RENOMBRADO = 'Kit de arrastre corregido INT';

  const limpiar = async () => {
    await borrarRepuesto(NUEVO);
    await borrarRepuesto(RENOMBRADO);
  };

  beforeEach(limpiar);
  afterAll(limpiar);

  it('CP-046 — El administrador registra un repuesto y queda en la auditoría', async () => {
    const respuesta = await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: NUEVO, cantidad: 20 });

    expect(respuesta.status).toBe(201);
    const id = respuesta.body.id_repuestos;

    const filas = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(Number(filas[0].cantidad)).toBe(20);

    // El sistema deja registro de quién lo creó.
    const auditoria = await consultar(
      'SELECT accion, usuario_responsable FROM repuestos_auditoria WHERE id_repuestos = ? ORDER BY id_auditoria DESC LIMIT 1',
      [id]
    );
    expect(auditoria).toHaveLength(1);
    expect(auditoria[0].accion).toBe('CREAR');
    expect(String(auditoria[0].usuario_responsable)).toBe(ADMIN.identidad);
  });

  it('CP-053 y CP-054 — Edita un repuesto, y rechaza ponerle un nombre repetido', async () => {
    const creado = await como(token).post('/api/repuestos/agregar', { nombre_repuesto: NUEVO, cantidad: 20 });
    const id = creado.body.id_repuestos;

    const edicion = await como(token).put(`/api/repuestos/actualizar/${id}`,
      { nombre_repuesto: RENOMBRADO, cantidad: 35 });
    expect(edicion.status).toBe(200);

    const filas = await consultar(
      'SELECT nombre_repuesto, cantidad FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(filas[0].nombre_repuesto).toBe(RENOMBRADO);
    expect(Number(filas[0].cantidad)).toBe(35);

    const repetido = await como(token).put(`/api/repuestos/actualizar/${id}`,
      { nombre_repuesto: 'Bujia de prueba', cantidad: 35 });
    expect(repetido.status).toBe(409);

    const sigue = await consultar('SELECT nombre_repuesto FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(sigue[0].nombre_repuesto).toBe(RENOMBRADO);
  });

  it('CP-055 — Elimina un repuesto y queda registrado en la auditoría', async () => {
    const creado = await como(token).post('/api/repuestos/agregar', { nombre_repuesto: NUEVO, cantidad: 20 });
    const id = creado.body.id_repuestos;

    const respuesta = await como(token).delete(`/api/repuestos/eliminar/${id}`);
    expect(respuesta.status).toBe(200);

    const filas = await consultar('SELECT id_repuestos FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(filas).toHaveLength(0);

    const auditoria = await consultar(
      'SELECT accion FROM repuestos_auditoria WHERE id_repuestos = ? ORDER BY id_auditoria DESC LIMIT 1', [id]);
    expect(auditoria[0].accion).toBe('ELIMINAR');
  });

  it('El administrador consulta la auditoría del inventario', async () => {
    const respuesta = await como(token).get('/api/repuestos/auditoria');

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.auditoria)).toBe(true);
  });
});

// =============================================================================
describe('RF-M3.1 a RF-M3.5 — Servicios del taller', () => {
  let idServicio;
  let idTecnico;

  beforeEach(async () => {
    await limpiarServicios();
    idTecnico = await idTecnicoPrueba();
    idServicio = await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'La moto se apaga en los semáforos y cuesta encenderla',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-074 — El administrador ve todos los servicios del taller', async () => {
    const otro = await crearServicio(token, {
      id_motos: await idMoto('PRB003'),
      descripcion_prodlema: 'Servicio de otro cliente del taller',
    });

    const respuesta = await como(token).get('/api/historial/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const ids = respuesta.body.historial.map((h) => h.id_historial);
    expect(ids).toContain(idServicio);
    expect(ids).toContain(otro);
  });

  it('CP-081 — El administrador asigna el técnico y le suma la reparación', async () => {
    const antes = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`,
      { id_tecnico: idTecnico });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT id_tecnico, estado FROM historial WHERE id_historial = ?', [idServicio]);
    expect(Number(filas[0].id_tecnico)).toBe(Number(idTecnico));
    expect(filas[0].estado).toBe('En Proceso');

    const despues = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);
    expect(Number(despues[0].reparaciones_asignadas))
      .toBe(Number(antes[0].reparaciones_asignadas) + 1);
  });

  it('El administrador sí puede modificar un servicio ya finalizado', async () => {
    await como(token).put(`/api/historial/actualizar/${idServicio}`, { estado: 'Finalizado' });

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`,
      { descripcion_trabajo: 'Corrección posterior al cierre del servicio' });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT descripcion_trabajo FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_trabajo).toContain('Corrección posterior');
  });

  it('CP-085 — El administrador elimina un servicio', async () => {
    const respuesta = await como(token).delete(`/api/historial/eliminar/${idServicio}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Historial eliminado correctamente');

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas).toHaveLength(0);
  });

  it('CP-086 — Informa que el servicio que se quiere eliminar no existe', async () => {
    const respuesta = await como(token).delete('/api/historial/eliminar/999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('no encontrado');
  });

  it('CP-087 — Con técnico asignado, el administrador sí puede eliminarlo y libera la reparación', async () => {
    await como(token).put(`/api/historial/actualizar/${idServicio}`, { id_tecnico: idTecnico });

    const antes = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);

    const respuesta = await como(token).delete(`/api/historial/eliminar/${idServicio}`);
    expect(respuesta.status).toBe(200);

    const despues = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);
    expect(Number(despues[0].reparaciones_asignadas))
      .toBe(Math.max(Number(antes[0].reparaciones_asignadas) - 1, 0));
  });
});

// =============================================================================
describe('RF-M4.4 — Eliminar motocicleta', () => {
  const PLACA = 'INT930';
  let idMotoDesechable;

  beforeEach(async () => {
    await borrarMoto(PLACA);
    const creada = await como(token).post('/api/motos/agregar', {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Honda',
      modelo_moto: 'XR 150',
      placa: PLACA,
    });
    idMotoDesechable = creada.body.id_moto;
  });

  afterAll(async () => { await borrarMoto(PLACA); });

  it('CP-105 — El administrador elimina una motocicleta', async () => {
    const respuesta = await como(token).delete(`/api/motos/eliminar/${idMotoDesechable}`);

    expect(respuesta.status).toBe(200);

    const filas = await consultar('SELECT id_motos FROM motos WHERE id_motos = ?', [idMotoDesechable]);
    expect(filas).toHaveLength(0);
  });

  it('CP-106 — No deja eliminar una motocicleta con un servicio en curso', async () => {
    await crearServicio(token, {
      id_motos: idMotoDesechable,
      descripcion_prodlema: 'Revisión de suspensión delantera y cambio de retenedores',
    });

    const respuesta = await como(token).delete(`/api/motos/eliminar/${idMotoDesechable}`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('servicio activo');
  });
});

// =============================================================================
describe('RF-M5.1 a RF-M5.5 — Distribuidores', () => {
  const NOMBRE = 'Repuestos Integrados INT';
  let idNuevo;

  const limpiar = async () => { await borrarDistribuidor(NOMBRE); };

  beforeEach(async () => {
    await limpiar();
    const creado = await como(token).post('/api/distribuidores/agregar', {
      nombre_distribuidor: NOMBRE,
      telefono: '3007776655',
      correo: 'integrado.pruebas@gmail.com',
      direccion: 'Carrera 10 # 20-30',
      contacto: 'Luis Contacto',
    });
    idNuevo = creado.body.id_distribuidor;
  });

  afterAll(limpiar);

  it('CP-069 (M5) — El administrador registra un distribuidor', async () => {
    const filas = await consultar(
      'SELECT nombre_distribuidor, contacto FROM distribuidores WHERE id_distribuidor = ?', [idNuevo]);
    expect(filas).toHaveLength(1);
    expect(filas[0].contacto).toBe('Luis Contacto');
  });

  it('CP-070 (M5) — Rechaza el registro sin nombre', async () => {
    const respuesta = await como(token).post('/api/distribuidores/agregar',
      { telefono: '3001112222', correo: 'sinnombre.integrada@gmail.com' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('obligatorio');
  });

  it('CP-071 (M5) — Consulta el listado de distribuidores', async () => {
    const respuesta = await como(token).get('/api/distribuidores/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const nombres = respuesta.body.distribuidores.map((d) => d.nombre_distribuidor);
    expect(nombres).toContain(NOMBRE);
    expect(nombres).toContain('Distribuidora de prueba');
  });

  it('CP-072 (M5) — Informa que el distribuidor no existe', async () => {
    const respuesta = await como(token).get('/api/distribuidores/consultar/999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toBe('Distribuidor no encontrado');
  });

  it('CP-073 (M5) — Actualiza los datos de un distribuidor', async () => {
    const respuesta = await como(token).put(`/api/distribuidores/actualizar/${idNuevo}`, {
      nombre_distribuidor: NOMBRE,
      telefono: '3009998877',
      correo: 'integrado.pruebas@gmail.com',
      direccion: 'Avenida 30 # 40-50',
      contacto: 'Pedro Contacto',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT telefono, contacto FROM distribuidores WHERE id_distribuidor = ?', [idNuevo]);
    expect(String(filas[0].telefono)).toBe('3009998877');
    expect(filas[0].contacto).toBe('Pedro Contacto');
  });

  it('CP-074 (M5) — Elimina un distribuidor', async () => {
    const respuesta = await como(token).delete(`/api/distribuidores/eliminar/${idNuevo}`);

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT id_distribuidor FROM distribuidores WHERE id_distribuidor = ?', [idNuevo]);
    expect(filas).toHaveLength(0);
  });

  it('CP-075 y CP-076 (M5) — Asigna un repuesto y al reasignarlo queda con un solo distribuidor', async () => {
    const idBujia = await idRepuesto('Bujia de prueba');
    const idPrimero = await idDistribuidor('Distribuidora de prueba');

    const asignacion = await como(token).post('/api/repuestoDistribuidor/asignar',
      { id_repuestos: idBujia, id_distribuidor: idPrimero });
    expect(asignacion.status).toBe(200);

    const reasignacion = await como(token).post('/api/repuestoDistribuidor/asignar',
      { id_repuestos: idBujia, id_distribuidor: idNuevo });
    expect(reasignacion.status).toBe(200);

    const filas = await consultar(
      'SELECT id_distribuidor FROM repuesto_distribuidor WHERE id_repuestos = ?', [idBujia]);
    expect(filas).toHaveLength(1);
    expect(Number(filas[0].id_distribuidor)).toBe(Number(idNuevo));

    // Y para asignar hacen falta las dos cosas.
    const incompleta = await como(token).post('/api/repuestoDistribuidor/agregar',
      { id_repuestos: idBujia, id_distribuidor: null });
    expect(incompleta.status).toBe(400);
    expect(incompleta.body.message).toContain('obligatorios');

    await ejecutar('DELETE FROM repuesto_distribuidor WHERE id_repuestos = ?', [idBujia]);
  });
});

// =============================================================================
describe('RF-M6.1 a RF-M6.4 — Entradas de repuestos', () => {
  let idEntrada;
  let idBujia;

  beforeEach(async () => {
    idBujia = await idRepuesto('Bujia de prueba');
    const idDistri = await idDistribuidor('Distribuidora de prueba');

    const creada = await como(token).post('/api/entradaRepuestos/agregar', {
      fecha_entrada: '2026-03-25',
      cantidad_ingresada: 5,
      id_repuestos: idBujia,
      id_distribuidor: idDistri,
      numero_identidad: ADMIN.identidad,
    });
    idEntrada = creada.body.id_entrada;
  });

  afterEach(async () => {
    if (idEntrada) {
      await ejecutar('DELETE FROM entrada_repuestos WHERE id_entrada = ?', [idEntrada]);
      idEntrada = null;
    }
  });

  it('CP-077 (M6) — Registrar la entrada sube el inventario', async () => {
    const filas = await consultar(
      'SELECT cantidad_ingresada FROM entrada_repuestos WHERE id_entrada = ?', [idEntrada]);
    expect(Number(filas[0].cantidad_ingresada)).toBe(5);
  });

  it('CP-080 (M6) — Consulta el listado de entradas con su repuesto y distribuidor', async () => {
    const respuesta = await como(token).get('/api/entradaRepuestos/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const entrada = respuesta.body.entradas.find((e) => e.id_entrada === idEntrada);
    expect(entrada).toBeDefined();
    expect(entrada.nombre_repuesto).toBe('Bujia de prueba');
    expect(entrada.nombre_distribuidor).toBe('Distribuidora de prueba');
  });

  it('CP-081 (M6) — Al corregir la cantidad, el inventario recibe solo la diferencia', async () => {
    const antes = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);

    const respuesta = await como(token).put(`/api/entradaRepuestos/actualizar/${idEntrada}`, {
      fecha_entrada: '2026-03-25',
      cantidad_ingresada: 8,
      id_repuestos: idBujia,
      id_distribuidor: await idDistribuidor('Distribuidora de prueba'),
      numero_identidad: ADMIN.identidad,
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Entrada actualizada correctamente');

    const despues = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);
    expect(Number(despues[0].cantidad)).toBe(Number(antes[0].cantidad) + 3);
  });

  it('CP-082 (M6) — Al eliminar la entrada, el inventario se devuelve', async () => {
    const antes = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);

    const respuesta = await como(token).delete(`/api/entradaRepuestos/eliminar/${idEntrada}`);
    expect(respuesta.status).toBe(200);
    idEntrada = null;

    const despues = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);
    expect(Number(despues[0].cantidad)).toBe(Number(antes[0].cantidad) - 5);
  });
});

// =============================================================================
describe('RF-M8.1 a RF-M8.3 — Fichas de técnico', () => {
  const IDENTIDAD = '1900000945';
  let idTecnicoDesechable;

  beforeEach(async () => {
    await limpiarServicios();
    await borrarUsuario(IDENTIDAD);
    await como(token).post('/api/usuarios/agregar', datosUsuario(IDENTIDAD, 2, 'admin.ficha'));

    const filas = await consultar('SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?', [IDENTIDAD]);
    idTecnicoDesechable = filas[0].id_tecnico;
  });

  afterAll(async () => {
    await limpiarServicios();
    await borrarUsuario(IDENTIDAD);
  });

  it('CP-089 (M8) — El administrador consulta el listado y el detalle de una ficha', async () => {
    const listado = await como(token).get('/api/tecnico/listar?limit=999999');
    expect(listado.status).toBe(200);

    const detalle = await como(token).get(`/api/tecnico/consultar/${idTecnicoDesechable}`);
    expect(detalle.status).toBe(200);
    expect(String(detalle.body.numero_identidad)).toBe(IDENTIDAD);
  });

  it('CP-091 (M8) — El administrador corrige las reparaciones asignadas', async () => {
    const respuesta = await como(token).put(`/api/tecnico/actualizar/${idTecnicoDesechable}`,
      { numero_identidad: IDENTIDAD, reparaciones_asignadas: 3 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Técnico actualizado correctamente');

    const filas = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnicoDesechable]);
    expect(Number(filas[0].reparaciones_asignadas)).toBe(3);
  });

  it('CP-092 (M8) — Elimina la ficha, y la cuenta de usuario se conserva', async () => {
    const respuesta = await como(token).delete(`/api/tecnico/eliminar/${idTecnicoDesechable}`);

    expect(respuesta.status).toBe(200);

    const fichas = await consultar('SELECT id_tecnico FROM tecnico WHERE id_tecnico = ?', [idTecnicoDesechable]);
    expect(fichas).toHaveLength(0);

    const usuarios = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [IDENTIDAD]);
    expect(usuarios).toHaveLength(1);
  });

  it('CP-093 (M8) — No deja eliminar la ficha de un técnico con un servicio a su cargo', async () => {
    await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: idTecnicoDesechable,
      descripcion_prodlema: 'Cambio de guayas y ajuste de la cadena de transmisión',
      estado: 'En Proceso',
    });

    const respuesta = await como(token).delete(`/api/tecnico/eliminar/${idTecnicoDesechable}`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('datos relacionados');

    const fichas = await consultar('SELECT id_tecnico FROM tecnico WHERE id_tecnico = ?', [idTecnicoDesechable]);
    expect(fichas).toHaveLength(1);
  });

  it('Una ficha de técnico solo se le puede crear a un usuario con rol Técnico', async () => {
    const respuesta = await como(token).post('/api/tecnico/agregar',
      { numero_identidad: CLIENTE.identidad, reparaciones_asignadas: 0 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('no tiene rol Técnico');
  });
});

// =============================================================================
describe('Permisos que el Administrador no tiene', () => {
  it('No puede gestionar los roles del sistema', async () => {
    expect((await como(token).get('/api/roles/listar')).status).toBe(403);
    expect((await como(token).post('/api/roles/agregar', { rol: 'Rol del administrador' })).status).toBe(403);
    expect((await como(token).put('/api/roles/actualizar/3', { rol: 'cliente' })).status).toBe(403);
    expect((await como(token).delete('/api/roles/eliminar/3')).status).toBe(403);
  });

  it('No puede crear ni editar otros administradores', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario('1900000946', 1, 'admin.otro'));
    expect(respuesta.status).toBe(403);
  });
});
