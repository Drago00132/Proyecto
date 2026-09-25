// =============================================================================
//  PRUEBAS INTEGRADAS — ROL RECEPCIONISTA
// =============================================================================
//  Recorren todo lo que el Recepcionista puede hacer en el sistema: es quien
//  atiende en el mostrador, así que registra clientes y sus motos, abre el
//  servicio a nombre del cliente, le asigna el técnico y mueve el inventario.
//  Cada prueba manda una petición real, que recorre la ruta, el control de
//  permisos, el controlador, el modelo y la base de datos de pruebas.
//
//  Los casos que no dependen del rol (correo inexistente al iniciar sesión,
//  enlace de recuperación vencido, y demás) se prueban una sola vez, en
//  Cliente.test.js.
// =============================================================================

jest.mock('../../config/mailer', () => ({
  enviarCorreoRecuperacion: jest.fn().mockResolvedValue(true),
  enviarCorreoCodigo2FA: jest.fn().mockResolvedValue(true),
}));

const {
  USUARIOS, CONTRASENA, comprobarBaseDePruebas, iniciarSesion, como, sinSesion,
  consultar, ejecutar, datosUsuario, borrarUsuario, borrarMoto, borrarRepuesto,
  limpiarServicios, idMoto, idTecnicoPrueba, idRepuesto, idDistribuidor,
  crearServicio, cerrarConexiones,
} = require('./apoyo');

const RECEPCION = USUARIOS.recepcionista;
const CLIENTE = USUARIOS.cliente;

let token;
let tokenAdmin;

beforeAll(async () => {
  comprobarBaseDePruebas();
  token = await iniciarSesion('recepcionista');
  tokenAdmin = await iniciarSesion('administrador');
});

afterAll(async () => {
  await limpiarServicios();
  await cerrarConexiones();
});

// =============================================================================
describe('RF-M1.2 — Iniciar sesión', () => {
  it('CP-006 — El recepcionista inicia sesión y recibe su credencial', async () => {
    await ejecutar(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
      [RECEPCION.correo]
    );

    const respuesta = await sinSesion.post('/api/login/login',
      { correo_electronico: RECEPCION.correo, contrasena: CONTRASENA });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toBeDefined();
    expect(Number(respuesta.body.rol)).toBe(16);
    expect(respuesta.body.requiere2FA).toBeUndefined();
  });
});

// =============================================================================
describe('RF-M1.4 — Editar perfil propio', () => {
  let perfilOriginal;

  beforeAll(async () => {
    const filas = await consultar(
      'SELECT nombre, apellido, correo_electronico, numero_celular FROM usuarios WHERE numero_identidad = ?',
      [RECEPCION.identidad]
    );
    perfilOriginal = filas[0];
  });

  afterAll(async () => {
    await ejecutar(
      'UPDATE usuarios SET nombre = ?, apellido = ?, correo_electronico = ?, numero_celular = ? WHERE numero_identidad = ?',
      [perfilOriginal.nombre, perfilOriginal.apellido, perfilOriginal.correo_electronico,
       perfilOriginal.numero_celular, RECEPCION.identidad]
    );
  });

  it('CP-014 — El recepcionista actualiza sus propios datos', async () => {
    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Rosa Editada',
      apellido: 'Pruebas',
      correo_electronico: RECEPCION.correo,
      numero_celular: '3006665544',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT nombre, numero_celular FROM usuarios WHERE numero_identidad = ?', [RECEPCION.identidad]);
    expect(filas[0].nombre).toBe('Rosa Editada');
    expect(String(filas[0].numero_celular)).toBe('3006665544');
  });

  it('CP-018 — El recepcionista no puede editar a un técnico', async () => {
    const respuesta = await como(token).put(`/api/usuarios/actualizar/${USUARIOS.tecnico.identidad}`, {
      numero_identidad: USUARIOS.tecnico.identidad,
      tipo_documento: 'Cedula de Ciudadania',
      nombre: 'Intento',
      apellido: 'Denegado',
      fecha_nacimiento: '1992-07-22',
      numero_celular: '3001110002',
      correo_electronico: USUARIOS.tecnico.correo,
      id_rol: 2,
    });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar(
      'SELECT nombre FROM usuarios WHERE numero_identidad = ?', [USUARIOS.tecnico.identidad]);
    expect(filas[0].nombre).not.toBe('Intento');
  });
});

// =============================================================================
describe('RF-M1.5 — Consultar usuarios registrados', () => {
  it('CP-020 — El recepcionista consulta el listado de usuarios', async () => {
    const respuesta = await como(token).get('/api/usuarios/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.usuarios)).toBe(true);
    expect(respuesta.body.usuarios.length).toBeGreaterThan(0);
  });

  it('El listado nunca devuelve la contraseña de nadie', async () => {
    const respuesta = await como(token).get('/api/usuarios/listar?limit=999999');

    respuesta.body.usuarios.forEach((u) => {
      expect(u.contrasena).toBeUndefined();
    });
  });

  it('CP-023 — El listado viene paginado', async () => {
    const respuesta = await como(token).get('/api/usuarios/listar?page=1&limit=5');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuarios.length).toBeLessThanOrEqual(5);
    expect(respuesta.body.currentPage).toBe(1);
    expect(respuesta.body.totalPages).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
describe('RF-M1.9 — Registrar usuario por personal interno', () => {
  const NUEVO_CLIENTE = '1900000910';
  const NUEVO_TECNICO = '1900000911';

  beforeEach(async () => {
    await borrarUsuario(NUEVO_CLIENTE);
    await borrarUsuario(NUEVO_TECNICO);
  });

  afterAll(async () => {
    await borrarUsuario(NUEVO_CLIENTE);
    await borrarUsuario(NUEVO_TECNICO);
  });

  it('CP-038 — El recepcionista registra un cliente', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(NUEVO_CLIENTE, 3, 'recep.cliente'));

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [NUEVO_CLIENTE]);
    expect(Number(filas[0].id_rol)).toBe(3);
  });

  it('CP-039 — El recepcionista no puede registrar un técnico', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(NUEVO_TECNICO, 2, 'recep.tecnico'));

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [NUEVO_TECNICO]);
    expect(filas).toHaveLength(0);
  });

  it('El recepcionista tampoco puede registrar administradores', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(NUEVO_TECNICO, 1, 'recep.admin'));

    expect(respuesta.status).toBe(403);
  });

  it('Los roles que puede asignar son solo los de Cliente', async () => {
    const respuesta = await como(token).get('/api/usuarios/roles-asignables');

    expect(respuesta.status).toBe(200);
    const ids = respuesta.body.roles.map((r) => Number(r.id_rol));
    expect(ids).toEqual([3]);
  });
});

// =============================================================================
describe('RF-M2.1 a RF-M2.4 — Inventario de repuestos', () => {
  const NUEVO = 'Guaya de freno INT';

  beforeEach(async () => { await borrarRepuesto(NUEVO); });
  afterAll(async () => { await borrarRepuesto(NUEVO); });

  it('CP-046 — El recepcionista registra un repuesto', async () => {
    const respuesta = await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: NUEVO, cantidad: 12 });

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT cantidad FROM repuestos WHERE nombre_repuesto = ?', [NUEVO]);
    expect(Number(filas[0].cantidad)).toBe(12);
  });

  it('CP-047 — Rechaza un nombre de repuesto repetido', async () => {
    const respuesta = await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: 'Bujia de prueba', cantidad: 5 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('Ya existe');
  });

  it('CP-048 — Rechaza una cantidad negativa', async () => {
    const respuesta = await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: NUEVO, cantidad: -5 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('mayor o igual a 0');

    const filas = await consultar('SELECT nombre_repuesto FROM repuestos WHERE nombre_repuesto = ?', [NUEVO]);
    expect(filas).toHaveLength(0);
  });

  it('CP-049 — El recepcionista consulta el inventario', async () => {
    const respuesta = await como(token).get('/api/repuestos/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const nombres = respuesta.body.repuesto.map((r) => r.nombre_repuesto);
    expect(nombres).toContain('Bujia de prueba');
  });

  it('CP-050 — Informa cuando el repuesto buscado no existe', async () => {
    const respuesta = await como(token).get('/api/repuestos/buscar?nombre=repuesto que no existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toBe('producto no encontrado');
  });

  it('CP-053 — El recepcionista edita un repuesto', async () => {
    const creado = await como(token).post('/api/repuestos/agregar', { nombre_repuesto: NUEVO, cantidad: 12 });
    const id = creado.body.id_repuestos;

    const respuesta = await como(token).put(`/api/repuestos/actualizar/${id}`,
      { nombre_repuesto: NUEVO, cantidad: 30 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Repuesto actualizado correctamente');

    const filas = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(Number(filas[0].cantidad)).toBe(30);
  });

  it('CP-056 — El recepcionista elimina un repuesto', async () => {
    const creado = await como(token).post('/api/repuestos/agregar', { nombre_repuesto: NUEVO, cantidad: 12 });
    const id = creado.body.id_repuestos;

    const respuesta = await como(token).delete(`/api/repuestos/eliminar/${id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Repuesto eliminado correctamente');

    const filas = await consultar('SELECT id_repuestos FROM repuestos WHERE id_repuestos = ?', [id]);
    expect(filas).toHaveLength(0);
  });

  it('CP-057 — Informa cuando el repuesto que se quiere eliminar no existe', async () => {
    const respuesta = await como(token).delete('/api/repuestos/eliminar/999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('no encontrado');
  });
});

// =============================================================================
describe('RF-M4.1 — Registrar motocicleta a nombre del cliente', () => {
  const PLACA = 'INT920';

  beforeEach(async () => { await borrarMoto(PLACA); });
  afterAll(async () => { await borrarMoto(PLACA); });

  it('CP-098 — El recepcionista registra la moto a nombre del cliente', async () => {
    const respuesta = await como(token).post('/api/motos/agregar', {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Kawasaki',
      modelo_moto: 'Rouser NS 200',
      placa: PLACA,
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT numero_identidad FROM motos WHERE placa = ?', [PLACA]);
    expect(String(filas[0].numero_identidad)).toBe(CLIENTE.identidad);
  });

  it('CP-100 — El recepcionista ve las motocicletas de todos los clientes', async () => {
    const respuesta = await como(token).get('/api/motos/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const placas = respuesta.body.motos.map((m) => m.placa);
    expect(placas).toContain('PRB001');
    // Y también las del otro cliente, a diferencia de lo que ve un Cliente.
    expect(placas).toContain('PRB003');
  });
});

// =============================================================================
describe('RF-M3.1 — Registrar historial a nombre del cliente', () => {
  beforeEach(async () => { await limpiarServicios(); });
  afterAll(async () => { await limpiarServicios(); });

  it('CP-070 — El recepcionista abre el servicio a nombre del cliente', async () => {
    const id = await idMoto('PRB001');

    const respuesta = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'Cambio de aceite y revisión general de los frenos',
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar(
      'SELECT estado, descripcion_trabajo FROM historial WHERE id_motos = ?', [id]);
    expect(filas).toHaveLength(1);
    expect(filas[0].estado).toBe('En Asignacion');
    // El diagnóstico no lo escribe el recepcionista.
    expect(filas[0].descripcion_trabajo).toBeNull();
  });

  it('CP-070 — El recepcionista puede dejar el técnico asignado desde el inicio', async () => {
    const id = await idMoto('PRB001');
    const idTecnico = await idTecnicoPrueba();

    const respuesta = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      id_tecnico: idTecnico,
      descripcion_prodlema: 'Revisión de la suspensión delantera y trasera',
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT id_tecnico FROM historial WHERE id_motos = ?', [id]);
    expect(Number(filas[0].id_tecnico)).toBe(Number(idTecnico));
  });

  it('CP-067 — No deja abrir un segundo servicio en una moto que ya tiene uno activo', async () => {
    const id = await idMoto('PRB001');
    await crearServicio(token, {
      id_motos: id,
      descripcion_prodlema: 'Cambio de aceite y revisión general de los frenos',
    });

    const segundo = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'Otro problema distinto en la misma motocicleta',
    });

    expect(segundo.status).toBe(409);
    expect(segundo.body.message).toContain('historial activo');
  });
});

// =============================================================================
describe('RF-M3.2 — Consultar historial', () => {
  let idUno;
  let idOtro;

  beforeAll(async () => {
    await limpiarServicios();
    idUno = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Ruido en la transmisión al cambiar de marcha',
    });
    idOtro = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB003'),
      descripcion_prodlema: 'Servicio de otro cliente del taller',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-073 — El recepcionista ve todos los servicios del taller', async () => {
    const respuesta = await como(token).get('/api/historial/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const ids = respuesta.body.historial.map((h) => h.id_historial);
    expect(ids).toContain(idUno);
    expect(ids).toContain(idOtro);
  });

  it('CP-075 — Puede consultar un servicio por su número de registro', async () => {
    const respuesta = await como(token).get(`/api/historial/consultar/${idUno}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.id_historial).toBe(idUno);
    expect(respuesta.body.placa).toBe('PRB001');
  });
});

// =============================================================================
describe('RF-M3.3 y RF-M3.4 — Asignar técnico y límites de edición', () => {
  let idServicio;
  let idTecnico;

  beforeEach(async () => {
    await limpiarServicios();
    idTecnico = await idTecnicoPrueba();
    idServicio = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'La moto se apaga en los semáforos y cuesta encenderla',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-079 y CP-082 — El recepcionista asigna el técnico y el servicio pasa a En Proceso', async () => {
    const antes = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`,
      { id_tecnico: idTecnico });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT id_tecnico, estado FROM historial WHERE id_historial = ?', [idServicio]);
    expect(Number(filas[0].id_tecnico)).toBe(Number(idTecnico));
    expect(filas[0].estado).toBe('En Proceso');

    // Y al técnico se le suma esa reparación.
    const despues = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);
    expect(Number(despues[0].reparaciones_asignadas))
      .toBe(Number(antes[0].reparaciones_asignadas) + 1);
  });

  it('CP-080 — El recepcionista no puede tocar el diagnóstico ni el estado', async () => {
    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_prodlema: 'El recepcionista intenta escribir el diagnóstico',
      descripcion_trabajo: 'Y también la solución',
      estado: 'Finalizado',
    });

    // La petición no falla: el sistema simplemente ignora lo que no le compete.
    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT descripcion_prodlema, descripcion_trabajo, estado FROM historial WHERE id_historial = ?',
      [idServicio]
    );
    expect(filas[0].descripcion_prodlema).toContain('La moto se apaga en los semáforos');
    expect(filas[0].descripcion_trabajo).toBeNull();
    expect(filas[0].estado).not.toBe('Finalizado');
  });

  it('CP-083 — No deja asignar técnico a un servicio ya finalizado', async () => {
    await como(tokenAdmin).put(`/api/historial/actualizar/${idServicio}`, { estado: 'Finalizado' });

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`,
      { id_tecnico: idTecnico });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('finalizado');

    const filas = await consultar('SELECT id_tecnico FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].id_tecnico).toBeNull();
  });
});

// =============================================================================
describe('RF-M3.5 — Eliminar historial', () => {
  it('CP-088 — El recepcionista no puede eliminar servicios', async () => {
    await limpiarServicios();
    const idServicio = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Servicio para comprobar que el recepcionista no lo borra',
    });

    const respuesta = await como(token).delete(`/api/historial/eliminar/${idServicio}`);

    expect(respuesta.status).toBe(403);

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas).toHaveLength(1);

    await limpiarServicios();
  });
});

// =============================================================================
describe('RF-M5.2 — Consultar distribuidores', () => {
  it('CP-071 (M5) — El recepcionista puede consultar el listado de distribuidores', async () => {
    const respuesta = await como(token).get('/api/distribuidores/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const nombres = respuesta.body.distribuidores.map((d) => d.nombre_distribuidor);
    expect(nombres).toContain('Distribuidora de prueba');
  });

  it('No puede registrar, editar ni eliminar distribuidores', async () => {
    const id = await idDistribuidor('Distribuidora de prueba');

    expect((await como(token).post('/api/distribuidores/agregar',
      { nombre_distribuidor: 'Distribuidora del recepcionista' })).status).toBe(403);
    expect((await como(token).put(`/api/distribuidores/actualizar/${id}`,
      { nombre_distribuidor: 'Cambiado' })).status).toBe(403);
    expect((await como(token).delete(`/api/distribuidores/eliminar/${id}`)).status).toBe(403);
  });
});

// =============================================================================
describe('RF-M6.1 — Registrar entrada de repuestos', () => {
  let idEntrada = null;

  afterEach(async () => {
    if (idEntrada) {
      await ejecutar('DELETE FROM entrada_repuestos WHERE id_entrada = ?', [idEntrada]);
      idEntrada = null;
    }
  });

  it('CP-077 (M6) — El recepcionista registra una entrada y el inventario sube', async () => {
    const idBujia = await idRepuesto('Bujia de prueba');
    const idDistri = await idDistribuidor('Distribuidora de prueba');

    const antes = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);

    const respuesta = await como(token).post('/api/entradaRepuestos/agregar', {
      fecha_entrada: '2026-03-20',
      cantidad_ingresada: 7,
      id_repuestos: idBujia,
      id_distribuidor: idDistri,
      numero_identidad: RECEPCION.identidad,
    });

    expect(respuesta.status).toBe(201);
    idEntrada = respuesta.body.id_entrada;

    const despues = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);
    expect(Number(despues[0].cantidad)).toBe(Number(antes[0].cantidad) + 7);
  });

  it('CP-078 (M6) — Rechaza una cantidad inválida y no toca el inventario', async () => {
    const idBujia = await idRepuesto('Bujia de prueba');
    const idDistri = await idDistribuidor('Distribuidora de prueba');

    const antes = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);

    const respuesta = await como(token).post('/api/entradaRepuestos/agregar', {
      fecha_entrada: '2026-03-21',
      cantidad_ingresada: -3,
      id_repuestos: idBujia,
      id_distribuidor: idDistri,
      numero_identidad: RECEPCION.identidad,
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('mayor a 0');

    const despues = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);
    expect(Number(despues[0].cantidad)).toBe(Number(antes[0].cantidad));
  });

  it('El recepcionista registra la entrada, pero no consulta, edita ni borra las de antes', async () => {
    expect((await como(token).get('/api/entradaRepuestos/listar')).status).toBe(403);
    expect((await como(token).put('/api/entradaRepuestos/actualizar/1',
      { fecha_entrada: '2026-03-20', cantidad_ingresada: 1, id_repuestos: 1, id_distribuidor: 1, numero_identidad: RECEPCION.identidad })).status).toBe(403);
    expect((await como(token).delete('/api/entradaRepuestos/eliminar/1')).status).toBe(403);
  });
});

// =============================================================================
describe('RF-M8.1 — Consultar técnicos', () => {
  it('CP-089 (M8) — El recepcionista consulta el listado de técnicos', async () => {
    const respuesta = await como(token).get('/api/tecnico/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    const identidades = respuesta.body.tecnico.map((t) => String(t.numero_identidad));
    expect(identidades).toContain(USUARIOS.tecnico.identidad);
  });

  it('No puede editar ni eliminar fichas de técnico', async () => {
    const idTecnico = await idTecnicoPrueba();

    expect((await como(token).put(`/api/tecnico/actualizar/${idTecnico}`,
      { numero_identidad: USUARIOS.tecnico.identidad, reparaciones_asignadas: 99 })).status).toBe(403);
    expect((await como(token).delete(`/api/tecnico/eliminar/${idTecnico}`)).status).toBe(403);
  });
});

// =============================================================================
describe('Permisos que el Recepcionista no tiene', () => {
  it('No puede eliminar cuentas de usuario', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${CLIENTE.identidad}`);
    expect(respuesta.status).toBe(403);

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [CLIENTE.identidad]);
    expect(filas).toHaveLength(1);
  });

  it('No puede hacer carga masiva de técnicos', async () => {
    expect((await como(token).post('/api/usuarios/cargar-masiva', {})).status).toBe(403);
  });

  it('No puede gestionar roles', async () => {
    expect((await como(token).get('/api/roles/listar')).status).toBe(403);
    expect((await como(token).post('/api/roles/agregar', { rol: 'Rol del recepcionista' })).status).toBe(403);
  });

  it('No puede ver la auditoría de repuestos', async () => {
    expect((await como(token).get('/api/repuestos/auditoria')).status).toBe(403);
  });
});
