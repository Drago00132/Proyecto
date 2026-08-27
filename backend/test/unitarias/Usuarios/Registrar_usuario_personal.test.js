// RF-M1.9 — Registrar usuario por personal interno
// Casos de prueba asociados: CP-034, CP-035, CP-036, CP-037, CP-038, CP-039, CP-040
//
// FALTAN respecto al documento de Casos de Prueba:
//   - CP-035 Administrador registra Recepcionista: no había una prueba específica para esta
//     combinación exacta. Se agrega abajo.
//   - CP-036 Administrador registra Técnico (ficha automática): la parte de "ficha
//     automática" la genera un TRIGGER de la base de datos (crear_ficha_tecnico), no el
//     controlador. A nivel de prueba unitaria (con el modelo mockeado) solo se puede
//     verificar que el controlador acepta el rol Técnico y llama a create con ese id_rol;
//     la creación real de la ficha solo se puede confirmar con una prueba de integración
//     contra la base de datos real, no aquí.

jest.mock('../model/usuariosModelo');

const { crearUsuario } = require('../controller/usuariosController');
const usuario_modelo = require('../model/usuariosModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

const datosBase = {
    numero_identidad: '111',
    tipo_documento: 'Cedula de Ciudadania',
    nombre: 'Usuario Nuevo',
    fecha_nacimiento: '2000-01-01',
    correo_electronico: 'nuevo@correo.com',
    contrasena: 'password123'
};

describe('RF-M1.9 — Registrar usuario por personal interno', () => {
    test('CP-034 — Administrador SÍ puede registrar un Cliente', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        const req = { usuario: { rol: 1 }, body: { ...datosBase, id_rol: 3 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).toHaveBeenCalledWith(expect.objectContaining({ id_rol: 3 }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-035 — Administrador SÍ puede registrar una Recepcionista', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        const req = { usuario: { rol: 1 }, body: { ...datosBase, id_rol: 16 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).toHaveBeenCalledWith(expect.objectContaining({ id_rol: 16 }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-036 — Administrador SÍ puede registrar un Técnico (la ficha automática la crea un trigger, no se prueba aquí)', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        const req = { usuario: { rol: 1 }, body: { ...datosBase, id_rol: 2 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).toHaveBeenCalledWith(expect.objectContaining({ id_rol: 2 }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-037 — Administrador NO puede registrar otro Administrador', async () => {
        const req = { usuario: { rol: 1 }, body: { ...datosBase, id_rol: 1 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('Administrador tampoco puede registrar un Súper Administrador (misma regla que CP-037)', async () => {
        const req = { usuario: { rol: 1 }, body: { ...datosBase, id_rol: 17 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('CP-038 — Recepcionista SÍ puede registrar un Cliente', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        const req = { usuario: { rol: 16 }, body: { ...datosBase, id_rol: 3 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-039 — Recepcionista NO puede registrar un Técnico', async () => {
        const req = { usuario: { rol: 16 }, body: { ...datosBase, id_rol: 2 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('CP-040 — Súper Administrador SÍ puede registrar otro Administrador', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        const req = { usuario: { rol: 17 }, body: { ...datosBase, id_rol: 1 } };
        const res = crearRes();
        await crearUsuario(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});