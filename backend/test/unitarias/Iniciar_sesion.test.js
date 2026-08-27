// RF-M1.2 — Iniciar sesión
// Casos de prueba asociados: CP-006, CP-007, CP-008, CP-009
//
// Nota de alcance: las pruebas de 2FA (verificarCodigo2FA) NO van en este archivo, aunque
// ocurren dentro del mismo flujo de login. El segundo factor de autenticación corresponde
// a RNF-006 (un requisito NO funcional), no a este RF-M1.2. Si quieres, armamos un archivo
// RNF-006.test.js aparte con ese mismo criterio.
//
// Los 4 casos de prueba de este RF-M1.2 ya estaban cubiertos; no falta ninguno.

jest.mock('../model/auhtModel');
jest.mock('../config/mailer');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('crypto');
jest.mock('../utils/manejarError');

const { login } = require('../controller/auhtController');
const usuariosModelo = require('../model/auhtModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const manejarError = require('../utils/manejarError');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

let req, res;

beforeEach(() => {
    jest.clearAllMocks();
    req = { body: { correo_electronico: 'test@correo.com', contrasena: 'password123' } };
    res = crearRes();
});

describe('RF-M1.2 — Iniciar sesión', () => {
    test('CP-007 — Debería retornar 401 si el correo no existe', async () => {
        usuariosModelo.buscarPorCorreo.mockResolvedValue(null);

        await login(req, res);

        expect(usuariosModelo.buscarPorCorreo).toHaveBeenCalledWith('test@correo.com');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

    test('CP-008 — Debería retornar 401 con intentosRestantes si la contraseña es incorrecta', async () => {
        const usuarioSimulado = {
            numero_identidad: '12345678',
            correo_electronico: 'test@correo.com',
            contrasena: '$2b$10$hash',
            id_rol: 3,
            bloqueado_hasta: null
        };
        usuariosModelo.buscarPorCorreo.mockResolvedValue(usuarioSimulado);
        bcrypt.compare.mockResolvedValue(false);
        usuariosModelo.incrementarIntentosFallidos.mockResolvedValue(2);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Contraseña incorrecta", intentosRestantes: 3 });
    });

    test('CP-009 — Debería bloquear la cuenta al llegar al 5.º intento fallido', async () => {
        const usuarioSimulado = {
            numero_identidad: '12345678',
            correo_electronico: 'test@correo.com',
            contrasena: '$2b$10$hash',
            id_rol: 3,
            bloqueado_hasta: null
        };
        usuariosModelo.buscarPorCorreo.mockResolvedValue(usuarioSimulado);
        bcrypt.compare.mockResolvedValue(false);
        usuariosModelo.incrementarIntentosFallidos.mockResolvedValue(5);
        usuariosModelo.bloquearCuenta.mockResolvedValue(true);

        await login(req, res);

        expect(usuariosModelo.bloquearCuenta).toHaveBeenCalledWith('12345678', 15);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Cuenta bloqueada por 15 minutos') })
        );
    });

    test('Debería retornar 403 si la cuenta ya estaba bloqueada, sin llegar a comparar la contraseña', async () => {
        const enUnMinuto = new Date(Date.now() + 60000);
        usuariosModelo.buscarPorCorreo.mockResolvedValue({
            numero_identidad: '12345678',
            correo_electronico: 'test@correo.com',
            contrasena: '$2b$10$hash',
            id_rol: 3,
            bloqueado_hasta: enUnMinuto
        });

        await login(req, res);

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('CP-006 — Debería retornar 200 y el token si las credenciales son válidas y no requiere 2FA', async () => {
        const usuarioSimulado = {
            numero_identidad: '12345678',
            nombre: 'Juan Pérez',
            correo_electronico: 'test@correo.com',
            contrasena: '$2b$10$encriptado...',
            id_rol: 2,
            bloqueado_hasta: null
        };
        usuariosModelo.buscarPorCorreo.mockResolvedValue(usuarioSimulado);
        bcrypt.compare.mockResolvedValue(true);
        usuariosModelo.resetearIntentos.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token-falso-valido-123');

        await login(req, res);

        expect(usuariosModelo.resetearIntentos).toHaveBeenCalledWith(usuarioSimulado.numero_identidad);
        expect(res.json).toHaveBeenCalledWith({
            message: "Bienvenido",
            token: 'token-falso-valido-123',
            rol: usuarioSimulado.id_rol,
            numero_identidad: usuarioSimulado.numero_identidad
        });
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const errorConexion = new Error('conexión rechazada');
        errorConexion.code = 'ECONNREFUSED';
        usuariosModelo.buscarPorCorreo.mockRejectedValue(errorConexion);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });

    test('Debería delegar a manejarError ante cualquier otro error inesperado', async () => {
        const errorInesperado = new Error('algo raro pasó');
        usuariosModelo.buscarPorCorreo.mockRejectedValue(errorInesperado);

        await login(req, res);

        expect(manejarError).toHaveBeenCalledWith(errorInesperado, res);
    });
});