// RF-M1.1 — Registrar usuario (público)
// Casos de prueba: CP-001, CP-002, CP-003, CP-004

jest.mock('../../../model/usuariosModelo');
jest.mock('jsonwebtoken');
jest.mock('../../../utils/manejarError');

const { crearUsuario } = require('../../../controller/usuariosController');
const usuario_modelo = require('../../../model/usuariosModelo');
const jwt = require('jsonwebtoken');
const manejarError = require('../../../utils/manejarError');

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
    nombre: 'Cliente Nuevo',
    fecha_nacimiento: '2000-01-01',
    correo_electronico: 'nuevo@correo.com',
    contrasena: 'password123',
    id_rol: 3 
};

describe('RF-M1.1 — Registrar usuario (público)', () => {
    test('CP-004 — Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { body: { ...datosBase, nombre: '' } };
        const res = crearRes();

        await crearUsuario(req, res);

        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-001 — Debería fuerza el rol a Cliente y entregar token, sin importar lo que pida el body', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        jwt.sign.mockReturnValue('token-registro-publico');

        const req = { body: { ...datosBase, id_rol: 17 } }; 
        const res = crearRes();

        await crearUsuario(req, res);

        expect(usuario_modelo.create).toHaveBeenCalledWith(
            expect.objectContaining({ id_rol: 3 })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ token: 'token-registro-publico', rol: 3, numero_identidad: '111' })
        );
    });

    test('CP-002 — Debería delegar a manejarError si el documento ya existe (ER_DUP_ENTRY)', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        usuario_modelo.create.mockRejectedValue(error);

        const req = { body: datosBase };
        const res = crearRes();

        await crearUsuario(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });

    test('CP-003 — Un correo duplicado sigue el mismo camino que un documento duplicado (ER_DUP_ENTRY)', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        usuario_modelo.create.mockRejectedValue(error);

        const req = { body: { ...datosBase, correo_electronico: 'ya.registrado@correo.com' } };
        const res = crearRes();

        await crearUsuario(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        usuario_modelo.create.mockRejectedValue(error);

        const req = { body: datosBase };
        const res = crearRes();

        await crearUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});