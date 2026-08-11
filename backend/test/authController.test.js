// 1. Mockear las dependencias externas (Ajustadas a tus carpetas reales)
jest.mock('../model/auhtModel');
jest.mock('../config/mailer');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

// 2. Importar el controlador REAL usando el nombre exacto: auhtController
const { login } = require('../controller/auhtController'); 
const usuariosModelo = require('../model/auhtModel');

describe('Pruebas unitarias para AuthController - login', () => {
    let req, res;

    beforeEach(() => {
        // Limpiar mocks antes de cada prueba
        jest.clearAllMocks();

        // Simular objetos req y res de Express
        req = {
            body: {
                correo_electronico: 'test@correo.com',
                contrasena: 'password123'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    test('Debería retornar 401 si el usuario no es encontrado', async () => {
        // Simular que el modelo retorna null (usuario no existe)
        usuariosModelo.buscarPorCorreo.mockResolvedValue(null);

        // Ejecutar la función login de tu controlador
        await login(req, res);

        // Verificaciones de Jest
        expect(usuariosModelo.buscarPorCorreo).toHaveBeenCalledWith('test@correo.com');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

        test('Debería retornar 200 y el token si las credenciales son válidas y no requiere 2FA', async () => {
        // 1. Simular un usuario válido obtenido de la base de datos
        const usuarioSimulado = {
            numero_identidad: '12345678',
            nombre: 'Juan Pérez',
            correo_electronico: 'test@correo.com',
            contrasena: '$2b$10$encriptado...', // Contraseña hash simulada
            id_rol: 2, // Rol común (no está en, evita el flujo 2FA)
            bloqueado_hasta: null
        };

        // 2. Configurar los comportamientos de los mocks
        const bcrypt = require('bcrypt');
        usuariosModelo.buscarPorCorreo.mockResolvedValue(usuarioSimulado);
        bcrypt.compare.mockResolvedValue(true); // Simula que la contraseña coincide
        usuariosModelo.resetearIntentos.mockResolvedValue(true);
        
        // Simular que jwt.sign genera un token de prueba
        const jwt = require('jsonwebtoken');
        jwt.sign.mockReturnValue('token-falso-valido-123');

        // 3. Ejecutar el controlador
        await login(req, res);

        // 4. Verificaciones
        expect(usuariosModelo.buscarPorCorreo).toHaveBeenCalledWith('test@correo.com');
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', usuarioSimulado.contrasena);
        expect(usuariosModelo.resetearIntentos).toHaveBeenCalledWith(usuarioSimulado.numero_identidad);
        
        // Verificar que responde con un estado exitoso y los datos del usuario
        expect(res.json).toHaveBeenCalledWith({
            message: "Bienvenido",
            token: 'token-falso-valido-123',
            rol: usuarioSimulado.id_rol,
            numero_identidad: usuarioSimulado.numero_identidad
        });
    });

});
