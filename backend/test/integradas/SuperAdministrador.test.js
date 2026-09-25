// =============================================================================
//  PRUEBAS INTEGRADAS — ROL SÚPER ADMINISTRADOR
// =============================================================================
//  El Súper Administrador es el único que gestiona los roles del sistema y el
//  único que puede crear y quitar administradores. Estas pruebas recorren eso
//  en detalle, y comprueban además que sí alcanza el resto de los módulos del
//  taller, que ya se prueban a fondo en Administrador.test.js.
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
  consultar, ejecutar, datosUsuario, borrarUsuario, borrarRol, limpiarServicios,
  idMoto, idTecnicoPrueba, crearServicio, cerrarConexiones,
} = require('./apoyo');

const SUPER = USUARIOS.superadministrador;
const ADMIN = USUARIOS.administrador;
const CLIENTE = USUARIOS.cliente;

let token;

beforeAll(async () => {
  comprobarBaseDePruebas();
  token = await iniciarSesion('superadministrador');
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
      [SUPER.correo]
    );
  });

  it('CP-006 — El súper administrador entra en dos pasos', async () => {
    const primerPaso = await sinSesion.post('/api/login/login',
      { correo_electronico: SUPER.correo, contrasena: CONTRASENA });

    expect(primerPaso.status).toBe(200);
    expect(primerPaso.body.requiere2FA).toBe(true);
    expect(primerPaso.body.token).toBeUndefined();

    const filas = await consultar(
      'SELECT two_factor_code FROM usuarios WHERE correo_electronico = ?', [SUPER.correo]);
    expect(filas[0].two_factor_code).toMatch(/^\d{6}$/);

    const segundoPaso = await sinSesion.post('/api/login/verificar-2fa',
      { correo_electronico: SUPER.correo, codigo: String(filas[0].two_factor_code) });

    expect(segundoPaso.status).toBe(200);
    expect(segundoPaso.body.token).toBeDefined();
    expect(Number(segundoPaso.body.rol)).toBe(17);
  });
});

// =============================================================================
describe('RF-M1.9 — Registrar usuario por personal interno', () => {
  const ADMIN_NUEVO = '1900000950';
  const SUPER_NUEVO = '1900000951';

  const limpiar = async () => {
    await borrarUsuario(ADMIN_NUEVO);
    await borrarUsuario(SUPER_NUEVO);
  };

  beforeEach(limpiar);
  afterAll(limpiar);

  it('CP-040 — El súper administrador sí puede registrar un administrador', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(ADMIN_NUEVO, 1, 'super.admin'));

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [ADMIN_NUEVO]);
    expect(Number(filas[0].id_rol)).toBe(1);
  });

  it('Ni siquiera el súper administrador puede crear otro súper administrador', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario(SUPER_NUEVO, 17, 'super.super'));

    expect(respuesta.status).toBe(403);

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [SUPER_NUEVO]);
    expect(filas).toHaveLength(0);
  });

  it('Puede asignar los cuatro roles del taller, pero no el suyo', async () => {
    const respuesta = await como(token).get('/api/usuarios/roles-asignables');

    expect(respuesta.status).toBe(200);
    const ids = respuesta.body.roles.map((r) => Number(r.id_rol)).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 16]);
    expect(ids).not.toContain(17);
  });
});

// =============================================================================
describe('RF-M1.4 — Editar usuarios y cambiarles el rol', () => {
  const DESECHABLE = '1900000952';

  beforeEach(async () => {
    await borrarUsuario(DESECHABLE);
    await como(token).post('/api/usuarios/agregar', datosUsuario(DESECHABLE, 3, 'super.cambiarrol'));
  });

  afterAll(async () => { await borrarUsuario(DESECHABLE); });

  it('CP-016 — El súper administrador le cambia el rol a un usuario', async () => {
    const datos = datosUsuario(DESECHABLE, 16, 'super.cambiarrol');

    const respuesta = await como(token).put(`/api/usuarios/actualizar/${DESECHABLE}`, datos);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Usuario actualizado correctamente');

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [DESECHABLE]);
    expect(Number(filas[0].id_rol)).toBe(16);
  });

  it('No puede convertir a nadie en súper administrador', async () => {
    const datos = datosUsuario(DESECHABLE, 17, 'super.cambiarrol');

    const respuesta = await como(token).put(`/api/usuarios/actualizar/${DESECHABLE}`, datos);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('No tienes permiso');

    const filas = await consultar('SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [DESECHABLE]);
    expect(Number(filas[0].id_rol)).toBe(3);
  });

  it('El súper administrador sí puede editar a un administrador', async () => {
    const original = await consultar(
      'SELECT nombre FROM usuarios WHERE numero_identidad = ?', [ADMIN.identidad]);

    const respuesta = await como(token).put(`/api/usuarios/actualizar/${ADMIN.identidad}`, {
      numero_identidad: ADMIN.identidad,
      tipo_documento: 'Cedula de Ciudadania',
      nombre: 'Andres Corregido',
      apellido: 'Pruebas',
      fecha_nacimiento: '1988-05-05',
      numero_celular: '3001110010',
      correo_electronico: ADMIN.correo,
      id_rol: 1,
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar('SELECT nombre FROM usuarios WHERE numero_identidad = ?', [ADMIN.identidad]);
    expect(filas[0].nombre).toBe('Andres Corregido');

    await ejecutar('UPDATE usuarios SET nombre = ? WHERE numero_identidad = ?',
      [original[0].nombre, ADMIN.identidad]);
  });
});

// =============================================================================
describe('RF-M1.6 — Eliminar cuenta de usuario', () => {
  const ADMIN_DESECHABLE = '1900000953';

  beforeEach(async () => {
    await borrarUsuario(ADMIN_DESECHABLE);
    await como(token).post('/api/usuarios/agregar', datosUsuario(ADMIN_DESECHABLE, 1, 'super.borraradmin'));
  });

  afterAll(async () => { await borrarUsuario(ADMIN_DESECHABLE); });

  it('CP-024 — El súper administrador sí puede eliminar a un administrador', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${ADMIN_DESECHABLE}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Usuario eliminado correctamente');

    const filas = await consultar(
      'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [ADMIN_DESECHABLE]);
    expect(filas).toHaveLength(0);
  });

  it('No puede eliminar la cuenta de un súper administrador', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${SUPER.identidad}`);

    expect(respuesta.status).toBe(403);

    const filas = await consultar(
      'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [SUPER.identidad]);
    expect(filas).toHaveLength(1);
  });
});

// =============================================================================
describe('RF-M7.1 — Registrar rol', () => {
  const NUEVO = 'Auxiliar INT83';

  beforeEach(async () => { await borrarRol(NUEVO); });
  afterAll(async () => { await borrarRol(NUEVO); });

  it('CP-083 (M7) — El súper administrador registra un rol nuevo', async () => {
    const respuesta = await como(token).post('/api/roles/agregar', { rol: NUEVO });

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT rol FROM roles WHERE id_rol = ?', [respuesta.body.id_rol]);
    expect(filas[0].rol).toBe(NUEVO);
  });

  it('Rechaza un rol sin nombre', async () => {
    const respuesta = await como(token).post('/api/roles/agregar', { rol: '   ' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('obligatorio');
  });
});

// =============================================================================
describe('RF-M7.2 — Consultar roles', () => {
  it('CP-084 (M7) — El súper administrador consulta el listado de roles', async () => {
    const respuesta = await como(token).get('/api/roles/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const ids = respuesta.body.rol.map((r) => Number(r.id_rol));
    [1, 2, 3, 16, 17].forEach((id) => expect(ids).toContain(id));
  });

  it('CP-084 (M7) — La gestión de roles es exclusiva suya', async () => {
    const tokenAdmin = await iniciarSesion('administrador');

    expect((await como(tokenAdmin).get('/api/roles/listar')).status).toBe(403);
    expect((await como(tokenAdmin).post('/api/roles/agregar', { rol: 'Rol ajeno INT' })).status).toBe(403);
  });
});

// =============================================================================
describe('RF-M7.3 — Editar rol', () => {
  const ORIGINAL = 'Auxiliar INT85';
  const CORREGIDO = 'Auxiliar taller INT';
  let idRol;

  const limpiar = async () => {
    await borrarRol(ORIGINAL);
    await borrarRol(CORREGIDO);
  };

  beforeEach(async () => {
    await limpiar();
    const creado = await como(token).post('/api/roles/agregar', { rol: ORIGINAL });
    idRol = creado.body.id_rol;
  });

  afterAll(limpiar);

  it('CP-085 (M7) — El súper administrador cambia el nombre de un rol', async () => {
    const respuesta = await como(token).put(`/api/roles/actualizar/${idRol}`, { rol: CORREGIDO });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Rol actualizado correctamente');

    const filas = await consultar('SELECT rol FROM roles WHERE id_rol = ?', [idRol]);
    expect(filas[0].rol).toBe(CORREGIDO);
  });

  it('Informa que el rol que se quiere editar no existe', async () => {
    const respuesta = await como(token).put('/api/roles/actualizar/999999', { rol: 'Inexistente' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toBe('Rol no encontrado');
  });
});

// =============================================================================
describe('RF-M7.4 — Eliminar rol', () => {
  const DESECHABLE = 'Auxiliar INT86';
  const IDENTIDAD = '1900000954';
  let idRol;

  const limpiar = async () => {
    await borrarUsuario(IDENTIDAD);
    await borrarRol(DESECHABLE);
  };

  beforeEach(async () => {
    await limpiar();
    const creado = await como(token).post('/api/roles/agregar', { rol: DESECHABLE });
    idRol = creado.body.id_rol;
  });

  afterAll(limpiar);

  it('CP-086 (M7) — El súper administrador elimina un rol', async () => {
    const respuesta = await como(token).delete(`/api/roles/eliminar/${idRol}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Rol eliminado correctamente');

    const filas = await consultar('SELECT id_rol FROM roles WHERE id_rol = ?', [idRol]);
    expect(filas).toHaveLength(0);
  });

  it('CP-087 (M7) — No deja eliminar los roles base del sistema', async () => {
    for (const idBase of [1, 2, 3, 16, 17]) {
      const respuesta = await como(token).delete(`/api/roles/eliminar/${idBase}`);
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.message).toContain('rol base');
    }

    const filas = await consultar('SELECT id_rol FROM roles WHERE id_rol IN (1,2,3,16,17)');
    expect(filas).toHaveLength(5);
  });

  it('CP-088 (M7) — No deja eliminar un rol que tiene usuarios asignados', async () => {
    await como(token).post('/api/usuarios/agregar', datosUsuario(IDENTIDAD, 3, 'super.rolusado'));
    await ejecutar('UPDATE usuarios SET id_rol = ? WHERE numero_identidad = ?', [idRol, IDENTIDAD]);

    const respuesta = await como(token).delete(`/api/roles/eliminar/${idRol}`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('usuario(s) asignado(s)');

    const filas = await consultar('SELECT id_rol FROM roles WHERE id_rol = ?', [idRol]);
    expect(filas).toHaveLength(1);
  });

  it('Informa que el rol que se quiere eliminar no existe', async () => {
    const respuesta = await como(token).delete('/api/roles/eliminar/999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toBe('Rol no encontrado');
  });
});

// =============================================================================
describe('RF-M8.1 a RF-M8.3 — Fichas de técnico', () => {
  const IDENTIDAD = '1900000955';
  let idTecnicoDesechable;

  beforeEach(async () => {
    await limpiarServicios();
    await borrarUsuario(IDENTIDAD);
    await como(token).post('/api/usuarios/agregar', datosUsuario(IDENTIDAD, 2, 'super.ficha'));

    const filas = await consultar('SELECT id_tecnico FROM tecnico WHERE numero_identidad = ?', [IDENTIDAD]);
    idTecnicoDesechable = filas[0].id_tecnico;
  });

  afterAll(async () => {
    await limpiarServicios();
    await borrarUsuario(IDENTIDAD);
  });

  it('CP-089 (M8) — Consulta el listado y el detalle de las fichas', async () => {
    expect((await como(token).get('/api/tecnico/listar?limit=999999')).status).toBe(200);

    const detalle = await como(token).get(`/api/tecnico/consultar/${idTecnicoDesechable}`);
    expect(detalle.status).toBe(200);
    expect(String(detalle.body.numero_identidad)).toBe(IDENTIDAD);
  });

  it('CP-091 y CP-092 (M8) — Edita y elimina una ficha de técnico', async () => {
    const edicion = await como(token).put(`/api/tecnico/actualizar/${idTecnicoDesechable}`,
      { numero_identidad: IDENTIDAD, reparaciones_asignadas: 5 });
    expect(edicion.status).toBe(200);

    const filas = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnicoDesechable]);
    expect(Number(filas[0].reparaciones_asignadas)).toBe(5);

    const borrado = await como(token).delete(`/api/tecnico/eliminar/${idTecnicoDesechable}`);
    expect(borrado.status).toBe(200);

    const fichas = await consultar('SELECT id_tecnico FROM tecnico WHERE id_tecnico = ?', [idTecnicoDesechable]);
    expect(fichas).toHaveLength(0);
  });
});

// =============================================================================
describe('El Súper Administrador alcanza todos los módulos del taller', () => {
  it('Llega a usuarios, inventario, distribuidores, entradas, motos y servicios', async () => {
    const modulos = [
      '/api/usuarios/listar',
      '/api/repuestos/listar',
      '/api/repuestos/auditoria',
      '/api/distribuidores/listar',
      '/api/entradaRepuestos/listar',
      '/api/motos/listar',
      '/api/historial/listar',
      '/api/tecnico/listar',
      '/api/roles/listar',
      '/api/repuestoDistribuidor/listar',
    ];

    for (const url of modulos) {
      const respuesta = await como(token).get(url);
      expect(respuesta.status).toBe(200);
    }
  });

  it('CP-074 — Ve los servicios de todos los clientes del taller', async () => {
    await limpiarServicios();

    const uno = await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Ruido en la transmisión al cambiar de marcha',
    });
    const otro = await crearServicio(token, {
      id_motos: await idMoto('PRB003'),
      descripcion_prodlema: 'Servicio de otro cliente del taller',
    });

    const respuesta = await como(token).get('/api/historial/listar?limit=999999');
    const ids = respuesta.body.historial.map((h) => h.id_historial);

    expect(ids).toContain(uno);
    expect(ids).toContain(otro);

    await limpiarServicios();
  });

  it('Puede modificar y cerrar un servicio ya finalizado', async () => {
    await limpiarServicios();
    const idTecnico = await idTecnicoPrueba();

    const idServicio = await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: idTecnico,
      descripcion_prodlema: 'Revisión completa de frenos delanteros y traseros',
      estado: 'Finalizado',
    });

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`,
      { descripcion_trabajo: 'Corrección posterior al cierre del servicio' });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT descripcion_trabajo FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_trabajo).toContain('Corrección posterior');

    await limpiarServicios();
  });
});
