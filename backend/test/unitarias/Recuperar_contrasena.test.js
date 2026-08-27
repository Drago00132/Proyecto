// RF-M1.3 — Recuperar contraseña mediante correo electrónico
// Casos de prueba asociados: CP-010, CP-011, CP-012, CP-013
//
// FALTAN respecto al documento de Casos de Prueba: ninguno. Los 4 CP ya estaban cubiertos.

jest.mock('../model/auhtModel');
jest.mock('../config/mailer');
jest.mock('bcrypt');
jest.mock('crypto');
jest.mock('../utils/manejarError');

const { solicitarRecuperacion, restablecerContrasena } = require('../controller/auhtController');
const usuariosModelo = require('../model/auhtModel');
const { enviarCorreoRecuperacion } = require('../config/mailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M1.3 — Solicitar recuperación de contraseña', () => {
    let req, res;

    beforeEach(() => {
        req = { body: { correo_electronico: 'cliente@correo.com' } };
        res = crearRes();
    });

    test('Debería retornar 400 si falta el correo electrónico', async () => {
        req.body = {};
        await solicitarRecuperacion(req, res);
        expect(usuariosModelo.buscarPorCorreo).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-011 — Debería retornar 404 si no existe una cuenta con ese correo', async () => {
        usuariosModelo.buscarPorCorreo.mockResolvedValue(null);
        await solicitarRecuperacion(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-010 — Debería generar el token, enviar el correo y responder 200 si el usuario existe', async () => {
        const usuario = { numero_identidad: '555', nombre: 'Cliente Uno', correo_electronico: 'cliente@correo.com' };
        usuariosModelo.buscarPorCorreo.mockResolvedValue(usuario);
        crypto.randomBytes.mockReturnValue({ toString: () => 'token-recuperacion-hex' });
        usuariosModelo.guardarTokenRecuperacion.mockResolvedValue(true);
        enviarCorreoRecuperacion.mockResolvedValue(true);

        await solicitarRecuperacion(req, res);

        expect(usuariosModelo.guardarTokenRecuperacion).toHaveBeenCalledWith('555', 'token-recuperacion-hex', expect.any(Date));
        expect(enviarCorreoRecuperacion).toHaveBeenCalledWith('cliente@correo.com', 'Cliente Uno', expect.stringContaining('token-recuperacion-hex'));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('enlace de recuperación') }));
    });
});

describe('RF-M1.3 — Restablecer contraseña con el enlace recibido', () => {
    let req, res;

    beforeEach(() => {
        req = { body: { token: 'token-valido', nueva_contrasena: 'password123', confirmar_contrasena: 'password123' } };
        res = crearRes();
    });

    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        req.body = { token: 'token-valido', nueva_contrasena: 'password123' };
        await restablecerContrasena(req, res);
        expect(usuariosModelo.buscarPorTokenRecuperacion).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-013 — Debería retornar 400 si las contraseñas no coinciden', async () => {
        req.body.confirmar_contrasena = 'otraPassword';
        await restablecerContrasena(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Las contraseñas no coinciden" });
    });

    test('Debería retornar 400 si la contraseña no cumple la longitud (8 a 20 caracteres)', async () => {
        req.body.nueva_contrasena = '123';
        req.body.confirmar_contrasena = '123';
        await restablecerContrasena(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 400 si el token no es válido (no existe ningún usuario con ese token)', async () => {
        usuariosModelo.buscarPorTokenRecuperacion.mockResolvedValue(null);
        await restablecerContrasena(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('no es válido') }));
    });

    test('CP-012 — Debería retornar 400 si el token ya expiró', async () => {
        const haceUnMinuto = new Date(Date.now() - 60000);
        usuariosModelo.buscarPorTokenRecuperacion.mockResolvedValue({
            numero_identidad: '555', reset_token_expira: haceUnMinuto
        });
        await restablecerContrasena(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('expiró') }));
    });

    test('Debería cifrar la contraseña, actualizarla y responder 200 si el token es válido', async () => {
        const enUnMinuto = new Date(Date.now() + 60000);
        usuariosModelo.buscarPorTokenRecuperacion.mockResolvedValue({
            numero_identidad: '555', reset_token_expira: enUnMinuto
        });
        bcrypt.hash.mockResolvedValue('hash-nueva-contrasena');
        usuariosModelo.actualizarContrasena.mockResolvedValue(true);

        await restablecerContrasena(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(usuariosModelo.actualizarContrasena).toHaveBeenCalledWith('555', 'hash-nueva-contrasena');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('actualizada correctamente') }));
    });
});