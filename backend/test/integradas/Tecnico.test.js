// =============================================================================
//  PRUEBAS INTEGRADAS — ROL TÉCNICO
// =============================================================================
//  Recorren todo lo que el Técnico puede hacer en el sistema, requerimiento
//  por requerimiento. Cada prueba le manda una petición real a la aplicación,
//  que pasa por la ruta, el control de permisos, el controlador, el modelo y
//  la base de datos de pruebas; después se comprueba en la propia base que lo
//  que dijo la respuesta de verdad quedó guardado.
//
//  Los casos que no dependen del rol (correo inexistente al iniciar sesión,
//  enlace de recuperación vencido, y demás) se prueban una sola vez, en
//  Cliente.test.js, que es donde viven los flujos abiertos a cualquiera.
// =============================================================================

jest.mock('../../config/mailer', () => ({
  enviarCorreoRecuperacion: jest.fn().mockResolvedValue(true),
  enviarCorreoCodigo2FA: jest.fn().mockResolvedValue(true),
}));

const {
  USUARIOS, CONTRASENA, comprobarBaseDePruebas, iniciarSesion, como, sinSesion,
  consultar, ejecutar, datosUsuario, limpiarServicios, idMoto, idTecnicoPrueba,
  idRepuesto, crearServicio, cerrarConexiones,
} = require('./apoyo');

const TECNICO = USUARIOS.tecnico;

let token;
let tokenAdmin;

beforeAll(async () => {
  comprobarBaseDePruebas();
  token = await iniciarSesion('tecnico');
  tokenAdmin = await iniciarSesion('administrador');
});

afterAll(async () => {
  await limpiarServicios();
  await cerrarConexiones();
});

// =============================================================================
describe('RF-M1.2 — Iniciar sesión', () => {
  it('CP-006 — El técnico inicia sesión y recibe su credencial', async () => {
    await ejecutar(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
      [TECNICO.correo]
    );

    const respuesta = await sinSesion.post('/api/login/login',
      { correo_electronico: TECNICO.correo, contrasena: CONTRASENA });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toBeDefined();
    expect(Number(respuesta.body.rol)).toBe(2);
    // El Técnico no pasa por verificación en dos pasos.
    expect(respuesta.body.requiere2FA).toBeUndefined();
  });
});

// =============================================================================
describe('RF-M1.4 — Editar perfil propio', () => {
  let perfilOriginal;

  beforeAll(async () => {
    const filas = await consultar(
      'SELECT nombre, apellido, correo_electronico, numero_celular FROM usuarios WHERE numero_identidad = ?',
      [TECNICO.identidad]
    );
    perfilOriginal = filas[0];
  });

  afterAll(async () => {
    await ejecutar(
      'UPDATE usuarios SET nombre = ?, apellido = ?, correo_electronico = ?, numero_celular = ? WHERE numero_identidad = ?',
      [perfilOriginal.nombre, perfilOriginal.apellido, perfilOriginal.correo_electronico,
       perfilOriginal.numero_celular, TECNICO.identidad]
    );
  });

  it('CP-014 — El técnico actualiza sus propios datos de contacto', async () => {
    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Tomas Editado',
      apellido: 'Pruebas',
      correo_electronico: TECNICO.correo,
      numero_celular: '3007778899',
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Perfil actualizado correctamente');

    const filas = await consultar(
      'SELECT nombre, numero_celular FROM usuarios WHERE numero_identidad = ?', [TECNICO.identidad]);
    expect(filas[0].nombre).toBe('Tomas Editado');
    expect(String(filas[0].numero_celular)).toBe('3007778899');
  });

  it('CP-015 — Desde el perfil propio no se puede cambiar el rol ni el documento', async () => {
    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Tomas',
      apellido: 'Pruebas',
      correo_electronico: TECNICO.correo,
      numero_celular: '3001110002',
      numero_identidad: '1900000998',
      id_rol: 1,
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT id_rol FROM usuarios WHERE numero_identidad = ?', [TECNICO.identidad]);
    expect(filas).toHaveLength(1);
    expect(Number(filas[0].id_rol)).toBe(2);
  });
});

// =============================================================================
describe('RF-M2.2 — Consultar repuestos', () => {
  it('CP-049 y CP-051 — El técnico consulta el listado general de repuestos', async () => {
    const respuesta = await como(token).get('/api/repuestos/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const nombres = respuesta.body.repuesto.map((r) => r.nombre_repuesto);
    expect(nombres).toContain('Bujia de prueba');
    expect(nombres).toContain('Filtro de prueba');
  });

  it('CP-052 — Al técnico se le niega el detalle individual de un repuesto', async () => {
    const id = await idRepuesto('Bujia de prueba');

    const respuesta = await como(token).get(`/api/repuestos/consultar/${id}`);
    expect(respuesta.status).toBe(403);

    // A quien administra el inventario sí se lo permite.
    const delAdmin = await como(tokenAdmin).get(`/api/repuestos/consultar/${id}`);
    expect(delAdmin.status).toBe(200);
    expect(delAdmin.body.nombre_repuesto).toBe('Bujia de prueba');
  });

  it('El técnico no puede tocar el inventario', async () => {
    expect((await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: 'Repuesto del tecnico', cantidad: 5 })).status).toBe(403);

    const id = await idRepuesto('Bujia de prueba');
    expect((await como(token).put(`/api/repuestos/actualizar/${id}`,
      { nombre_repuesto: 'Bujia de prueba', cantidad: 999 })).status).toBe(403);
    expect((await como(token).delete(`/api/repuestos/eliminar/${id}`)).status).toBe(403);
  });
});

// =============================================================================
describe('RF-M3.2 — Consultar historial', () => {
  let idAsignado;
  let idAjeno;

  beforeAll(async () => {
    await limpiarServicios();
    const idTecnico = await idTecnicoPrueba();

    idAsignado = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: idTecnico,
      descripcion_prodlema: 'Ruido en la transmisión al cambiar de marcha',
      estado: 'En Proceso',
    });

    idAjeno = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB002'),
      descripcion_prodlema: 'Servicio que todavía no tiene técnico asignado',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-072 — El técnico solo ve los servicios que tiene asignados', async () => {
    const respuesta = await como(token).get('/api/historial/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const ids = respuesta.body.historial.map((h) => h.id_historial);
    expect(ids).toContain(idAsignado);
    expect(ids).not.toContain(idAjeno);
  });
});

// =============================================================================
describe('RF-M3.3 — Modificar historial', () => {
  let idServicio;
  let idTecnico;

  beforeEach(async () => {
    await limpiarServicios();
    idTecnico = await idTecnicoPrueba();
    idServicio = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: idTecnico,
      descripcion_prodlema: 'Pérdida de potencia al subir pendientes y consumo alto',
      estado: 'En Proceso',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-076 — El técnico registra el avance del servicio que tiene asignado', async () => {
    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_trabajo: 'Se limpió el carburador y se cambió el filtro de aire',
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Historial actualizado correctamente');

    const filas = await consultar(
      'SELECT descripcion_trabajo FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_trabajo).toBe('Se limpió el carburador y se cambió el filtro de aire');
  });

  it('CP-076 — El técnico registra los repuestos usados y el inventario baja', async () => {
    const idBujia = await idRepuesto('Bujia de prueba');
    const antes = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_trabajo: 'Cambio de bujía',
      repuestos: [{ id_repuestos: idBujia, cantidad: 2 }],
    });

    expect(respuesta.status).toBe(200);

    const usados = await consultar(
      'SELECT cantidad FROM repuestos_historial WHERE id_historial = ? AND id_repuestos = ?',
      [idServicio, idBujia]);
    expect(usados).toHaveLength(1);
    expect(Number(usados[0].cantidad)).toBe(2);

    // El sistema descuenta del inventario lo que se usó en el servicio.
    const despues = await consultar('SELECT cantidad FROM repuestos WHERE id_repuestos = ?', [idBujia]);
    expect(Number(despues[0].cantidad)).toBe(Number(antes[0].cantidad) - 2);

    // Se devuelve el inventario para no alterar los datos de partida.
    await ejecutar('UPDATE repuestos SET cantidad = ? WHERE id_repuestos = ?', [antes[0].cantidad, idBujia]);
  });

  it('El técnico no puede pasar el servicio a otra motocicleta', async () => {
    const otraMoto = await idMoto('PRB002');

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      id_motos: otraMoto,
      descripcion_trabajo: 'Intento de reasignar la moto',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar('SELECT id_motos FROM historial WHERE id_historial = ?', [idServicio]);
    expect(Number(filas[0].id_motos)).not.toBe(Number(otraMoto));
  });

  it('El técnico cierra el servicio y se le libera esa reparación', async () => {
    const antes = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      estado: 'Finalizado',
      descripcion_trabajo: 'Servicio terminado y entregado al cliente',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar('SELECT estado FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].estado).toBe('Finalizado');

    const despues = await consultar(
      'SELECT reparaciones_asignadas FROM tecnico WHERE id_tecnico = ?', [idTecnico]);
    expect(Number(despues[0].reparaciones_asignadas))
      .toBe(Math.max(Number(antes[0].reparaciones_asignadas) - 1, 0));
  });

  it('CP-077 — No deja modificar un servicio que ya fue finalizado', async () => {
    await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      estado: 'Finalizado',
      descripcion_trabajo: 'Servicio terminado',
    });

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_trabajo: 'Intento sobre un servicio ya cerrado',
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('finalizado');

    const filas = await consultar(
      'SELECT descripcion_trabajo FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_trabajo).toBe('Servicio terminado');
  });
});

// =============================================================================
describe('RF-M3.6 — Generar documentación de historial', () => {
  let idFinalizado;

  beforeAll(async () => {
    await limpiarServicios();
    idFinalizado = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: await idTecnicoPrueba(),
      descripcion_prodlema: 'Revisión completa de frenos delanteros y traseros',
      descripcion_trabajo: 'Se cambiaron las pastillas y se purgó el líquido',
      estado: 'Finalizado',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-089 — El técnico obtiene los datos completos del servicio finalizado', async () => {
    // El documento se arma en la página con estos datos (ver la prueba de
    // Cypress RF-M3.6); aquí se comprueba que el sistema se los entrega
    // completos al técnico que atendió el servicio.
    const respuesta = await como(token).get(`/api/historial/consultar/${idFinalizado}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('Finalizado');
    expect(respuesta.body.placa).toBe('PRB001');
    expect(respuesta.body.descripcion_prodlema).toContain('Revisión completa de frenos');
    expect(respuesta.body.descripcion_trabajo).toContain('pastillas');
    expect(respuesta.body.fecha_inicio).toBeDefined();
    expect(Array.isArray(respuesta.body.repuestos)).toBe(true);
  });
});

// =============================================================================
describe('RF-M4.2 — Consultar motocicleta', () => {
  it('CP-101 — El técnico alcanza el listado general de motocicletas', async () => {
    const respuesta = await como(token).get('/api/motos/listar?limit=999999');

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.motos)).toBe(true);

    const placas = respuesta.body.motos.map((m) => m.placa);
    expect(placas).toContain('PRB001');
  });

  it('CP-102 — Al técnico se le niega el detalle individual de una motocicleta', async () => {
    const id = await idMoto('PRB001');

    expect((await como(token).get(`/api/motos/consultar/${id}`)).status).toBe(403);

    const delAdmin = await como(tokenAdmin).get(`/api/motos/consultar/${id}`);
    expect(delAdmin.status).toBe(200);
    expect(delAdmin.body.placa).toBe('PRB001');
  });

  it('El técnico no puede registrar, editar ni eliminar motocicletas', async () => {
    const id = await idMoto('PRB001');

    expect((await como(token).post('/api/motos/agregar', {
      numero_identidad: USUARIOS.cliente.identidad,
      marca_moto: 'Bajaj', modelo_moto: 'Pulsar', placa: 'INT910',
    })).status).toBe(403);

    expect((await como(token).put(`/api/motos/actualizar/${id}`, {
      numero_identidad: USUARIOS.cliente.identidad,
      marca_moto: 'Bajaj', modelo_moto: 'Pulsar', placa: 'PRB001',
    })).status).toBe(403);

    expect((await como(token).delete(`/api/motos/eliminar/${id}`)).status).toBe(403);
  });
});

// =============================================================================
describe('RF-M8.1 — Consultar técnicos', () => {
  it('CP-090 (M8) — El técnico solo se ve a sí mismo en el listado de técnicos', async () => {
    const respuesta = await como(token).get('/api/tecnico/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const identidades = respuesta.body.tecnico.map((t) => String(t.numero_identidad));
    expect(identidades).toEqual([TECNICO.identidad]);
  });

  it('CP-090 (M8) — Al técnico se le niega consultar una ficha por su identificador', async () => {
    const idTecnico = await idTecnicoPrueba();

    expect((await como(token).get(`/api/tecnico/consultar/${idTecnico}`)).status).toBe(403);
    expect((await como(token).put(`/api/tecnico/actualizar/${idTecnico}`,
      { numero_identidad: TECNICO.identidad, reparaciones_asignadas: 99 })).status).toBe(403);
    expect((await como(token).delete(`/api/tecnico/eliminar/${idTecnico}`)).status).toBe(403);
  });
});

// =============================================================================
describe('Permisos que el Técnico no tiene', () => {
  it('No puede registrar ni eliminar usuarios', async () => {
    expect((await como(token).post('/api/usuarios/agregar',
      datosUsuario('1900000905', 3, 'negado.tecnico'))).status).toBe(403);
    expect((await como(token).delete(`/api/usuarios/eliminar/${USUARIOS.cliente.identidad}`)).status).toBe(403);
  });

  it('No puede registrar servicios, solo atender los que le asignan', async () => {
    const id = await idMoto('PRB001');
    const respuesta = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'El técnico intenta abrir un servicio por su cuenta',
    });
    expect(respuesta.status).toBe(403);
  });

  it('No puede eliminar servicios', async () => {
    await limpiarServicios();
    const idServicio = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      id_tecnico: await idTecnicoPrueba(),
      descripcion_prodlema: 'Servicio para comprobar que el técnico no lo borra',
      estado: 'En Proceso',
    });

    expect((await como(token).delete(`/api/historial/eliminar/${idServicio}`)).status).toBe(403);

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas).toHaveLength(1);
  });

  it('No puede gestionar distribuidores, entradas ni roles', async () => {
    expect((await como(token).get('/api/distribuidores/listar')).status).toBe(403);
    expect((await como(token).get('/api/entradaRepuestos/listar')).status).toBe(403);
    expect((await como(token).get('/api/roles/listar')).status).toBe(403);
  });

  it('No puede ver la auditoría de repuestos', async () => {
    expect((await como(token).get('/api/repuestos/auditoria')).status).toBe(403);
  });
});
