// =============================================================================
//  PRUEBAS INTEGRADAS — ROL CLIENTE
// =============================================================================
//  Recorren, requerimiento por requerimiento, todo lo que el Cliente puede
//  hacer en el sistema. No hay simulacros: cada prueba le manda una petición
//  real a la aplicación, que pasa por la ruta, el control de permisos, el
//  controlador, el modelo y la base de datos de pruebas. Después se comprueba
//  en la propia base que lo que dijo la respuesta de verdad quedó guardado.
//
//  Lo único que se reemplaza es el envío de correo (servicio externo), para
//  que las pruebas no manden correos de verdad ni dependan de que el servidor
//  de correo responda.
// =============================================================================

jest.mock('../../config/mailer', () => ({
  enviarCorreoRecuperacion: jest.fn().mockResolvedValue(true),
  enviarCorreoCodigo2FA: jest.fn().mockResolvedValue(true),
}));

const {
  USUARIOS, CONTRASENA, comprobarBaseDePruebas, iniciarSesion, como, sinSesion,
  consultar, ejecutar, datosUsuario, borrarUsuario, borrarMoto, limpiarServicios,
  idMoto, idTecnicoPrueba, crearServicio, cerrarConexiones,
} = require('./apoyo');

const CLIENTE = USUARIOS.cliente;

let token;

beforeAll(async () => {
  comprobarBaseDePruebas();
  token = await iniciarSesion('cliente');
});

afterAll(async () => {
  await cerrarConexiones();
});

// =============================================================================
describe('RF-M1.1 — Registrar usuario (público)', () => {
  const NUEVO = '1900000901';
  const CORREO = 'integrada.cliente@gmail.com';

  const nuevoCliente = (cambios = {}) => ({
    numero_identidad: NUEVO,
    tipo_documento: 'Cedula de Ciudadania',
    nombre: 'Nuevo',
    apellido: 'Cliente',
    fecha_nacimiento: '1998-04-12',
    numero_celular: '3005550901',
    correo_electronico: CORREO,
    contrasena: CONTRASENA,
    // El formulario de registro manda el rol, pero el sistema lo ignora en el
    // registro público: aquí se manda el de Administrador a propósito, para
    // comprobar que nadie puede autoasignarse un rol al registrarse.
    id_rol: 1,
    ...cambios,
  });

  beforeEach(async () => { await borrarUsuario(NUEVO); });
  afterAll(async () => { await borrarUsuario(NUEVO); });

  it('CP-001 — Un visitante se registra y queda creado como Cliente', async () => {
    const respuesta = await sinSesion.post('/api/usuarios/registrar-publico', nuevoCliente());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.message).toContain('registrado exitosamente');
    expect(respuesta.body.token).toBeDefined();

    const filas = await consultar(
      'SELECT id_rol, contrasena FROM usuarios WHERE numero_identidad = ?', [NUEVO]
    );
    expect(filas).toHaveLength(1);
    // Aunque la petición pidió el rol Administrador, el registro público
    // siempre crea Clientes.
    expect(Number(filas[0].id_rol)).toBe(3);
    expect(Number(respuesta.body.rol)).toBe(3);
    // Y la contraseña queda cifrada, nunca en texto plano.
    expect(filas[0].contrasena).not.toBe(CONTRASENA);
    expect(filas[0].contrasena.startsWith('$2')).toBe(true);
  });

  it('CP-002 — Rechaza un documento que ya está registrado', async () => {
    const respuesta = await sinSesion.post('/api/usuarios/registrar-publico',
      nuevoCliente({ numero_identidad: CLIENTE.identidad, correo_electronico: 'otro.integrada@gmail.com' })
    );

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('Ya existe');
  });

  it('CP-003 — Rechaza un correo que ya está registrado', async () => {
    const respuesta = await sinSesion.post('/api/usuarios/registrar-publico',
      nuevoCliente({ correo_electronico: CLIENTE.correo })
    );

    expect(respuesta.status).toBe(409);

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [NUEVO]);
    expect(filas).toHaveLength(0);
  });

  it('CP-004 — Rechaza el registro con campos obligatorios vacíos', async () => {
    const incompleto = nuevoCliente();
    delete incompleto.fecha_nacimiento;

    const respuesta = await sinSesion.post('/api/usuarios/registrar-publico', incompleto);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('obligatorios');

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [NUEVO]);
    expect(filas).toHaveLength(0);
  });

  // CP-005 (menor de edad) no aparece aquí: hoy esa regla vive solo en el
  // formulario de la página, el servidor no comprueba la edad. La prueba de
  // ese caso está en cypress/e2e/Usuarios/RF-M1.1_Registrar_usuario_publico.cy.js.
});

// =============================================================================
describe('RF-M1.2 — Iniciar sesión', () => {
  beforeEach(async () => {
    await ejecutar(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
      [CLIENTE.correo]
    );
  });

  afterAll(async () => {
    await ejecutar(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?',
      [CLIENTE.correo]
    );
  });

  it('CP-006 — El cliente inicia sesión y recibe su credencial', async () => {
    const respuesta = await sinSesion.post('/api/login/login',
      { correo_electronico: CLIENTE.correo, contrasena: CONTRASENA });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toBeDefined();
    expect(Number(respuesta.body.rol)).toBe(3);
    // El Cliente no pasa por verificación en dos pasos.
    expect(respuesta.body.requiere2FA).toBeUndefined();
  });

  it('CP-007 — Rechaza el ingreso con un correo que no existe', async () => {
    const respuesta = await sinSesion.post('/api/login/login',
      { correo_electronico: 'no.existe.integrada@gmail.com', contrasena: CONTRASENA });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Usuario no encontrado');
  });

  it('CP-008 — Rechaza la contraseña incorrecta y cuenta el intento fallido', async () => {
    const respuesta = await sinSesion.post('/api/login/login',
      { correo_electronico: CLIENTE.correo, contrasena: 'ClaveMala123' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Contraseña incorrecta');
    expect(respuesta.body.intentosRestantes).toBe(4);

    const filas = await consultar(
      'SELECT intentos_fallidos FROM usuarios WHERE correo_electronico = ?', [CLIENTE.correo]);
    expect(Number(filas[0].intentos_fallidos)).toBe(1);
  });

  it('CP-009 — Bloquea la cuenta al quinto intento fallido', async () => {
    let ultima;
    for (let intento = 1; intento <= 5; intento += 1) {
      ultima = await sinSesion.post('/api/login/login',
        { correo_electronico: CLIENTE.correo, contrasena: 'ClaveMala123' });
    }

    expect(ultima.status).toBe(403);
    expect(ultima.body.message).toContain('Cuenta bloqueada');

    const filas = await consultar(
      'SELECT bloqueado_hasta FROM usuarios WHERE correo_electronico = ?', [CLIENTE.correo]);
    expect(filas[0].bloqueado_hasta).not.toBeNull();

    // Con la cuenta bloqueada, ni siquiera la contraseña correcta entra.
    const conClaveBuena = await sinSesion.post('/api/login/login',
      { correo_electronico: CLIENTE.correo, contrasena: CONTRASENA });
    expect(conClaveBuena.status).toBe(403);
  });
});

// =============================================================================
describe('RF-M1.3 — Recuperar contraseña', () => {
  let hashOriginal;

  beforeAll(async () => {
    const filas = await consultar('SELECT contrasena FROM usuarios WHERE correo_electronico = ?', [CLIENTE.correo]);
    hashOriginal = filas[0].contrasena;
  });

  afterAll(async () => {
    await ejecutar(
      'UPDATE usuarios SET contrasena = ?, reset_token = NULL, reset_token_expira = NULL WHERE correo_electronico = ?',
      [hashOriginal, CLIENTE.correo]
    );
  });

  const pedirEnlace = () =>
    sinSesion.post('/api/login/solicitar-recuperacion', { correo_electronico: CLIENTE.correo });

  const tokenVigente = async () => {
    const filas = await consultar('SELECT reset_token FROM usuarios WHERE correo_electronico = ?', [CLIENTE.correo]);
    return filas[0].reset_token;
  };

  it('CP-010 — El cliente recupera su contraseña y entra con la nueva', async () => {
    const solicitud = await pedirEnlace();
    expect(solicitud.status).toBe(200);
    expect(solicitud.body.message).toContain('enlace de recuperación');

    const enlace = await tokenVigente();
    expect(enlace).not.toBeNull();

    const nueva = 'NuevaClave2026!';
    const cambio = await sinSesion.post('/api/login/restablecer-contrasena',
      { token: enlace, nueva_contrasena: nueva, confirmar_contrasena: nueva });

    expect(cambio.status).toBe(200);
    expect(cambio.body.message).toContain('actualizada correctamente');

    // La nueva contraseña sirve para entrar.
    await ejecutar('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo_electronico = ?', [CLIENTE.correo]);
    const entrada = await sinSesion.post('/api/login/login',
      { correo_electronico: CLIENTE.correo, contrasena: nueva });
    expect(entrada.status).toBe(200);
    expect(entrada.body.token).toBeDefined();
  });

  it('CP-011 — Informa que el correo no está registrado', async () => {
    const respuesta = await sinSesion.post('/api/login/solicitar-recuperacion',
      { correo_electronico: 'no.existe.integrada@gmail.com' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('No existe una cuenta');
  });

  it('CP-012 — Rechaza un enlace de recuperación vencido', async () => {
    await pedirEnlace();
    const enlace = await tokenVigente();

    // Se adelanta el vencimiento en vez de esperar los 15 minutos.
    await ejecutar(
      'UPDATE usuarios SET reset_token_expira = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE correo_electronico = ?',
      [CLIENTE.correo]
    );

    const respuesta = await sinSesion.post('/api/login/restablecer-contrasena',
      { token: enlace, nueva_contrasena: 'OtraClave2026!', confirmar_contrasena: 'OtraClave2026!' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('expiró');
  });

  it('CP-013 — Rechaza el cambio si la confirmación no coincide', async () => {
    await pedirEnlace();
    const enlace = await tokenVigente();

    const respuesta = await sinSesion.post('/api/login/restablecer-contrasena',
      { token: enlace, nueva_contrasena: 'ClaveUno2026!', confirmar_contrasena: 'ClaveDos2026!' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('Las contraseñas no coinciden');
  });
});

// =============================================================================
describe('RF-M1.4 — Editar perfil propio', () => {
  let perfilOriginal;

  beforeAll(async () => {
    token = await iniciarSesion('cliente');
    const filas = await consultar(
      'SELECT nombre, apellido, correo_electronico, numero_celular FROM usuarios WHERE numero_identidad = ?',
      [CLIENTE.identidad]
    );
    perfilOriginal = filas[0];
  });

  afterAll(async () => {
    await ejecutar(
      'UPDATE usuarios SET nombre = ?, apellido = ?, correo_electronico = ?, numero_celular = ? WHERE numero_identidad = ?',
      [perfilOriginal.nombre, perfilOriginal.apellido, perfilOriginal.correo_electronico,
       perfilOriginal.numero_celular, CLIENTE.identidad]
    );
  });

  it('CP-014 — El cliente actualiza sus propios datos', async () => {
    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Camila Editada',
      apellido: 'Pruebas',
      correo_electronico: CLIENTE.correo,
      numero_celular: '3009998877',
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Perfil actualizado correctamente');

    const filas = await consultar(
      'SELECT nombre, numero_celular FROM usuarios WHERE numero_identidad = ?', [CLIENTE.identidad]);
    expect(filas[0].nombre).toBe('Camila Editada');
    expect(String(filas[0].numero_celular)).toBe('3009998877');
  });

  it('CP-015 — Desde el perfil propio no se puede cambiar el documento ni el rol', async () => {
    const respuesta = await como(token).put('/api/usuarios/mi-perfil', {
      nombre: 'Camila',
      apellido: 'Pruebas',
      correo_electronico: CLIENTE.correo,
      numero_celular: '3001110001',
      // Datos que el cliente no debería poder tocar por esta vía:
      numero_identidad: '1900000999',
      id_rol: 1,
      tipo_documento: 'Pasaporte',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT numero_identidad, id_rol, tipo_documento FROM usuarios WHERE numero_identidad = ?',
      [CLIENTE.identidad]
    );
    expect(filas).toHaveLength(1);
    expect(Number(filas[0].id_rol)).toBe(3);
    expect(filas[0].tipo_documento).toBe('Cedula de Ciudadania');
  });

  it('El perfil propio nunca devuelve la contraseña', async () => {
    const respuesta = await como(token).get('/api/usuarios/mi-perfil');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.numero_identidad).toBeDefined();
    expect(respuesta.body.contrasena).toBeUndefined();
  });
});

// =============================================================================
describe('RF-M1.6 — Eliminar cuenta de usuario', () => {
  it('CP-026 — El cliente no puede eliminar cuentas, ni la suya', async () => {
    const respuesta = await como(token).delete(`/api/usuarios/eliminar/${CLIENTE.identidad}`);

    expect(respuesta.status).toBe(403);

    const filas = await consultar('SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?', [CLIENTE.identidad]);
    expect(filas).toHaveLength(1);
  });
});

// =============================================================================
describe('RF-M1.7 — Cerrar sesión', () => {
  it('CP-029 — Sin credencial, el sistema no entrega ningún dato', async () => {
    // Cerrar sesión en el sistema es descartar la credencial en el navegador;
    // lo que se comprueba aquí es que sin ella no se llega a nada.
    const { request, app } = require('./apoyo');

    const sinCredencial = await request(app).get('/api/historial/listar');
    expect([401, 403]).toContain(sinCredencial.status);

    const conCredencialInventada = await request(app)
      .get('/api/historial/listar')
      .set('Authorization', 'Bearer credencial.inventada.123');
    expect([401, 403]).toContain(conCredencialInventada.status);
  });
});

// =============================================================================
describe('RF-M4.1 — Registrar motocicleta', () => {
  const PLACA = 'INT901';

  beforeEach(async () => { await borrarMoto(PLACA); });
  afterAll(async () => { await borrarMoto(PLACA); });

  it('CP-096 — El cliente registra su motocicleta', async () => {
    const respuesta = await como(token).post('/api/motos/agregar', {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Bajaj',
      modelo_moto: 'Pulsar NS 160',
      placa: PLACA,
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar(
      'SELECT numero_identidad, marca_moto FROM motos WHERE placa = ?', [PLACA]);
    expect(filas).toHaveLength(1);
    expect(String(filas[0].numero_identidad)).toBe(CLIENTE.identidad);
    expect(filas[0].marca_moto).toBe('Bajaj');
  });

  it('CP-097 — Rechaza una placa que ya está registrada', async () => {
    const respuesta = await como(token).post('/api/motos/agregar', {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Bajaj',
      modelo_moto: 'Pulsar NS 160',
      placa: 'PRB001',
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('Ya existe');
  });
});

// =============================================================================
describe('RF-M4.2 — Consultar motocicleta', () => {
  it('CP-099 — El cliente solo ve sus propias motocicletas', async () => {
    const respuesta = await como(token).get('/api/motos/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const placas = respuesta.body.motos.map((m) => m.placa);
    expect(placas).toContain('PRB001');
    expect(placas).toContain('PRB002');
    // PRB003 es del otro cliente.
    expect(placas).not.toContain('PRB003');

    // Ninguna de las motos que recibe es de otro dueño.
    respuesta.body.motos.forEach((m) => {
      expect(String(m.numero_identidad)).toBe(CLIENTE.identidad);
    });
  });
});

// =============================================================================
describe('RF-M4.3 — Actualizar motocicleta', () => {
  const PLACA = 'INT902';
  let idMotoDesechable;

  beforeEach(async () => {
    await borrarMoto(PLACA);
    const creada = await como(token).post('/api/motos/agregar', {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Yamaha',
      modelo_moto: 'YBR 125',
      placa: PLACA,
    });
    idMotoDesechable = creada.body.id_moto;
  });

  afterAll(async () => { await borrarMoto(PLACA); });

  it('CP-103 — El cliente actualiza los datos de su motocicleta', async () => {
    const respuesta = await como(token).put(`/api/motos/actualizar/${idMotoDesechable}`, {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Suzuki',
      modelo_moto: 'GN 125',
      placa: PLACA,
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Moto actualizada correctamente');

    const filas = await consultar('SELECT marca_moto, modelo_moto FROM motos WHERE placa = ?', [PLACA]);
    expect(filas[0].marca_moto).toBe('Suzuki');
    expect(filas[0].modelo_moto).toBe('GN 125');
  });

  it('CP-104 — Rechaza cambiar la placa por una que ya existe', async () => {
    const respuesta = await como(token).put(`/api/motos/actualizar/${idMotoDesechable}`, {
      numero_identidad: CLIENTE.identidad,
      marca_moto: 'Yamaha',
      modelo_moto: 'YBR 125',
      placa: 'PRB001',
    });

    expect(respuesta.status).toBe(409);

    const filas = await consultar('SELECT placa FROM motos WHERE id_motos = ?', [idMotoDesechable]);
    expect(filas[0].placa).toBe(PLACA);
  });
});

// =============================================================================
describe('RF-M4.4 — Eliminar motocicleta', () => {
  const PLACA = 'INT903';
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

  it('CP-105 — El cliente elimina una motocicleta suya', async () => {
    const respuesta = await como(token).delete(`/api/motos/eliminar/${idMotoDesechable}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Moto eliminada correctamente');

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

    const filas = await consultar('SELECT id_motos FROM motos WHERE id_motos = ?', [idMotoDesechable]);
    expect(filas).toHaveLength(1);
  });
});

// =============================================================================
describe('RF-M3.1 — Registrar historial (servicio)', () => {
  beforeEach(async () => { await limpiarServicios(); });
  afterAll(async () => { await limpiarServicios(); });

  it('CP-066 — El cliente reporta el servicio de su moto', async () => {
    const id = await idMoto('PRB001');

    const respuesta = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'La moto no enciende en frío y suena el motor de arranque',
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar(
      'SELECT estado, id_tecnico, descripcion_trabajo FROM historial WHERE id_motos = ?', [id]);
    expect(filas).toHaveLength(1);
    // El cliente solo reporta el problema: el servicio nace sin técnico, en
    // el estado inicial y sin diagnóstico.
    expect(filas[0].estado).toBe('En Asignacion');
    expect(filas[0].id_tecnico).toBeNull();
    expect(filas[0].descripcion_trabajo).toBeNull();
  });

  it('CP-066 — El cliente no puede fijar el estado ni el técnico al reportar', async () => {
    const id = await idMoto('PRB001');
    const idTecnico = await idTecnicoPrueba();

    const respuesta = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'Cambio de aceite y revisión general de los frenos',
      estado: 'Finalizado',
      id_tecnico: idTecnico,
      descripcion_trabajo: 'Ya lo arreglé yo mismo',
    });

    expect(respuesta.status).toBe(201);

    const filas = await consultar(
      'SELECT estado, id_tecnico, descripcion_trabajo FROM historial WHERE id_motos = ?', [id]);
    expect(filas[0].estado).toBe('En Asignacion');
    expect(filas[0].id_tecnico).toBeNull();
    expect(filas[0].descripcion_trabajo).toBeNull();
  });

  it('CP-067 — No deja abrir un segundo servicio en una moto que ya tiene uno activo', async () => {
    const id = await idMoto('PRB001');

    await crearServicio(token, {
      id_motos: id,
      descripcion_prodlema: 'La moto no enciende en frío y suena el motor de arranque',
    });

    const segundo = await como(token).post('/api/historial/agregar', {
      id_motos: id,
      descripcion_prodlema: 'Otro problema distinto en la misma motocicleta',
    });

    expect(segundo.status).toBe(409);
    expect(segundo.body.message).toContain('historial activo');

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_motos = ?', [id]);
    expect(filas).toHaveLength(1);
  });

  it('CP-068 — Rechaza una descripción vacía o demasiado corta', async () => {
    const id = await idMoto('PRB001');

    const vacia = await como(token).post('/api/historial/agregar',
      { id_motos: id, descripcion_prodlema: '' });
    expect(vacia.status).toBe(400);
    expect(vacia.body.message).toContain('obligatorios');

    const corta = await como(token).post('/api/historial/agregar',
      { id_motos: id, descripcion_prodlema: 'no prende' });
    expect(corta.status).toBe(400);
    expect(corta.body.message).toContain('10 caracteres');

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_motos = ?', [id]);
    expect(filas).toHaveLength(0);
  });
});

// =============================================================================
describe('RF-M3.2 — Consultar historial', () => {
  let idPropio;
  let idAjeno;

  beforeAll(async () => {
    await limpiarServicios();
    const tokenAdmin = await iniciarSesion('administrador');

    idPropio = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Ruido en la transmisión al cambiar de marcha',
    });

    idAjeno = await crearServicio(tokenAdmin, {
      id_motos: await idMoto('PRB003'),
      descripcion_prodlema: 'Servicio de otro cliente que no debe verse',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-071 — El cliente consulta el historial de sus motos', async () => {
    const respuesta = await como(token).get('/api/historial/listar?limit=999999');

    expect(respuesta.status).toBe(200);

    const ids = respuesta.body.historial.map((h) => h.id_historial);
    expect(ids).toContain(idPropio);
    // El servicio del otro cliente no le llega.
    expect(ids).not.toContain(idAjeno);

    const suyo = respuesta.body.historial.find((h) => h.id_historial === idPropio);
    expect(suyo.placa).toBe('PRB001');
    expect(suyo.descripcion_prodlema).toContain('Ruido en la transmisión');
  });
});

// =============================================================================
describe('RF-M3.3 — Modificar historial', () => {
  let idServicio;

  beforeEach(async () => {
    await limpiarServicios();
    idServicio = await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Pérdida de potencia al subir pendientes y consumo alto',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('El cliente corrige su propio reporte mientras nadie lo atiende', async () => {
    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_prodlema: 'Pérdida de potencia y además se calienta mucho el motor',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT descripcion_prodlema FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_prodlema).toContain('se calienta mucho');
  });

  it('CP-078 — Con técnico asignado, al cliente se le niega modificarlo', async () => {
    const tokenAdmin = await iniciarSesion('administrador');
    const idTecnico = await idTecnicoPrueba();
    await como(tokenAdmin).put(`/api/historial/actualizar/${idServicio}`, { id_tecnico: idTecnico });

    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      descripcion_prodlema: 'El cliente intenta cambiar el diagnóstico del taller',
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('técnico');

    const filas = await consultar(
      'SELECT descripcion_prodlema FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].descripcion_prodlema).toContain('Pérdida de potencia al subir pendientes');
  });

  it('El cliente no puede fijar el estado de su servicio', async () => {
    const respuesta = await como(token).put(`/api/historial/actualizar/${idServicio}`, {
      estado: 'Finalizado',
      descripcion_trabajo: 'Lo doy por terminado',
    });

    expect(respuesta.status).toBe(200);

    const filas = await consultar(
      'SELECT estado, descripcion_trabajo FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas[0].estado).not.toBe('Finalizado');
    expect(filas[0].descripcion_trabajo).toBeNull();
  });
});

// =============================================================================
describe('RF-M3.5 — Eliminar historial', () => {
  let idServicio;

  beforeEach(async () => {
    await limpiarServicios();
    idServicio = await crearServicio(token, {
      id_motos: await idMoto('PRB001'),
      descripcion_prodlema: 'Fuga de aceite por la tapa del motor desde hace una semana',
    });
  });

  afterAll(async () => { await limpiarServicios(); });

  it('CP-085 — El cliente elimina un servicio suyo que nadie ha tomado', async () => {
    const respuesta = await como(token).delete(`/api/historial/eliminar/${idServicio}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.message).toBe('Historial eliminado correctamente');

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas).toHaveLength(0);
  });

  it('CP-087 — Con técnico asignado, el cliente ya no puede eliminarlo', async () => {
    const tokenAdmin = await iniciarSesion('administrador');
    const idTecnico = await idTecnicoPrueba();
    await como(tokenAdmin).put(`/api/historial/actualizar/${idServicio}`, { id_tecnico: idTecnico });

    const respuesta = await como(token).delete(`/api/historial/eliminar/${idServicio}`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('técnico');

    const filas = await consultar('SELECT id_historial FROM historial WHERE id_historial = ?', [idServicio]);
    expect(filas).toHaveLength(1);
  });
});

// =============================================================================
describe('Permisos que el Cliente no tiene', () => {
  it('No puede registrar usuarios por la vía del personal interno', async () => {
    const respuesta = await como(token).post('/api/usuarios/agregar',
      datosUsuario('1900000904', 3, 'negado.cliente'));
    expect(respuesta.status).toBe(403);
  });

  it('No puede gestionar el inventario de repuestos', async () => {
    expect((await como(token).get('/api/repuestos/listar')).status).toBe(403);
    expect((await como(token).post('/api/repuestos/agregar',
      { nombre_repuesto: 'Repuesto del cliente', cantidad: 5 })).status).toBe(403);
  });

  it('No puede gestionar distribuidores, entradas, roles ni técnicos', async () => {
    expect((await como(token).get('/api/distribuidores/listar')).status).toBe(403);
    expect((await como(token).get('/api/entradaRepuestos/listar')).status).toBe(403);
    expect((await como(token).get('/api/roles/listar')).status).toBe(403);
    expect((await como(token).get('/api/tecnico/listar')).status).toBe(403);
  });

  it('No puede ver la auditoría de repuestos', async () => {
    expect((await como(token).get('/api/repuestos/auditoria')).status).toBe(403);
  });
});
