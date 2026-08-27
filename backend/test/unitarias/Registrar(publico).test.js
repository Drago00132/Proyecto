// RF-M1.1 — Registrar usuario (público)
// Casos de prueba asociados: CP-001, CP-002, CP-003, CP-004, CP-005
//
// FALTAN respecto al documento de Casos de Prueba (no están cubiertos todavía):
//   - CP-002 Documento duplicado: no hay una prueba que simule ER_DUP_ENTRY específicamente
//     en el flujo de registro público (si la quieres, se agrega igual que la de RF-M1.9).
//   - CP-003 Correo duplicado: mismo caso, falta la prueba específica.
//   - CP-005 Menor de edad: el backend (usuariosController.crearUsuario) NO valida la edad;
//     esa validación solo existe en el frontend (registar.js). No se puede escribir esta
//     prueba a nivel de controlador porque, tal como está el código, el backend aceptaría
//     un menor de edad si la petición llegara sin pasar por el formulario. Vale la pena
//     evaluar si se debe agregar esa validación también en el backend.

jest.mock('../model/usuariosModelo');
jest.mock('jsonwebtoken');
jest.mock('../utils/manejarError');

const { crearUsuario } = require('../controller/usuariosController');
const usuario_modelo = require('../model/usuariosModelo');
const jwt = require('jsonwebtoken');
const manejarError = require('../utils/manejarError');

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
    id_rol: 3 // el backend exige que venga presente, aunque en registro público siempre se sobrescribe a Cliente
};

describe('RF-M1.1 — Registrar usuario (público)', () => {
    // CP-004: campos obligatorios vacíos
    test('CP-004 — Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { body: { ...datosBase, nombre: '' } }; // sin req.usuario -> registro público
        const res = crearRes();

        await crearUsuario(req, res);

        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // CP-001: registro exitoso, y de paso verifica que el rol queda forzado a Cliente
    // aunque el body pida otro (vulnerabilidad que ya corregimos).
    test('CP-001 — Debería fuerza el rol a Cliente y entregar token, sin importar lo que pida el body', async () => {
        usuario_modelo.create.mockResolvedValue('111');
        jwt.sign.mockReturnValue('token-registro-publico');

        const req = { body: { ...datosBase, id_rol: 17 } }; // intenta autoasignarse Súper Administrador
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

    // CP-002: documento duplicado
    test('CP-002 — Debería delegar a manejarError si el documento ya existe (ER_DUP_ENTRY)', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        usuario_modelo.create.mockRejectedValue(error);

        const req = { body: datosBase };
        const res = crearRes();

        await crearUsuario(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });

    // CP-003: correo duplicado — a nivel de base de datos es el mismo camino que CP-002
    // (misma restricción UNIQUE, mismo error ER_DUP_ENTRY), por eso comparten prueba.
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