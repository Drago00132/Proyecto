const usuariosModelo = require('../model/auhtModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const manejarError = require('../utils/manejarError');
const crypto = require('crypto');
const { enviarCorreoRecuperacion, enviarCorreoCodigo2FA } = require('../config/mailer');

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const MINUTOS_VIGENCIA_TOKEN = 15;
const ROLES_CON_2FA = [1, 17];
const MINUTOS_CODIGO_2FA = 5;

exports.login = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;

    try {
        const usuario = await usuariosModelo.buscarPorCorreo(correo_electronico);

        if (!usuario) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
            return res.status(403).json({
                message: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en ${minutosRestantes} minuto(s).`
            });
        }

        const coinciden = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!coinciden) {
            const intentos = await usuariosModelo.incrementarIntentosFallidos(usuario.numero_identidad);

            if (intentos >= MAX_INTENTOS) {
                await usuariosModelo.bloquearCuenta(usuario.numero_identidad, MINUTOS_BLOQUEO);
                return res.status(403).json({
                    message: `Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos debido a ${MAX_INTENTOS} intentos fallidos consecutivos.`
                });
            }

            return res.status(401).json({
                message: "Contraseña incorrecta",
                intentosRestantes: MAX_INTENTOS - intentos
            });
        }

        await usuariosModelo.resetearIntentos(usuario.numero_identidad);

        if (ROLES_CON_2FA.includes(usuario.id_rol)) {
            const codigo = crypto.randomInt(100000, 1000000).toString();
            await usuariosModelo.guardarCodigo2FA(usuario.numero_identidad, codigo, MINUTOS_CODIGO_2FA);
            await enviarCorreoCodigo2FA(usuario.correo_electronico, usuario.nombre, codigo, MINUTOS_CODIGO_2FA);

            return res.status(200).json({
                requiere2FA: true,
                correo_electronico: usuario.correo_electronico,
                message: `Te enviamos un código de verificación a tu correo. Vence en ${MINUTOS_CODIGO_2FA} minutos.`
            });
        }

        const token = jwt.sign(
            { id: usuario.numero_identidad, nombre: usuario.nombre, rol: usuario.id_rol }, 
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
            
        );

        res.json({ message: "Bienvenido", token, rol: usuario.id_rol, numero_identidad: usuario.numero_identidad
});

    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.verificarCodigo2FA = async (req, res) => {
    const { correo_electronico, codigo } = req.body;

    if (!correo_electronico || !codigo) {
        return res.status(400).json({ message: "El correo y el código son obligatorios" });
    }

    try {
        const usuario = await usuariosModelo.buscarPorCorreo(correo_electronico);

        if (!usuario) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        if (!usuario.two_factor_code || !usuario.two_factor_code_expira) {
            return res.status(400).json({ message: "No hay un código pendiente para este usuario. Vuelve a iniciar sesión." });
        }

        if (new Date(usuario.two_factor_code_expira) < new Date()) {
            await usuariosModelo.limpiarCodigo2FA(usuario.numero_identidad);
            return res.status(400).json({ message: "El código expiró. Vuelve a iniciar sesión para recibir uno nuevo." });
        }

        if (String(codigo).trim() !== usuario.two_factor_code) {
            return res.status(401).json({ message: "Código incorrecto" });
        }

        await usuariosModelo.limpiarCodigo2FA(usuario.numero_identidad);

        const token = jwt.sign(
            { id: usuario.numero_identidad, nombre: usuario.nombre, rol: usuario.id_rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ message: "Bienvenido", token, rol: usuario.id_rol, numero_identidad: usuario.numero_identidad });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.solicitarRecuperacion = async (req, res) => {
    const { correo_electronico } = req.body;

    if (!correo_electronico) {
        return res.status(400).json({ message: "El correo electrónico es obligatorio" });
    }

    try {
        const usuario = await usuariosModelo.buscarPorCorreo(correo_electronico);

        if (!usuario) {
            return res.status(404).json({ message: "No existe una cuenta asociada a ese correo." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expira = new Date(Date.now() + MINUTOS_VIGENCIA_TOKEN * 60000);

        await usuariosModelo.guardarTokenRecuperacion(usuario.numero_identidad, token, expira);

        const enlace = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contrasena?token=${token}`;
        await enviarCorreoRecuperacion(usuario.correo_electronico, usuario.nombre, enlace);

        res.json({ message: "Se envió un enlace de recuperación a tu correo. Es válido por 15 minutos." });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.restablecerContrasena = async (req, res) => {
    const { token, nueva_contrasena, confirmar_contrasena } = req.body;

    if (!token || !nueva_contrasena || !confirmar_contrasena) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (nueva_contrasena !== confirmar_contrasena) {
        return res.status(400).json({ message: "Las contraseñas no coinciden" });
    }

    if (nueva_contrasena.length < 8 || nueva_contrasena.length > 20) {
        return res.status(400).json({ message: "La contraseña debe tener entre 8 y 20 caracteres" });
    }

    try {
        const usuario = await usuariosModelo.buscarPorTokenRecuperacion(token);

        if (!usuario) {
            return res.status(400).json({ message: "El enlace de recuperación no es válido." });
        }

        if (!usuario.reset_token_expira || new Date(usuario.reset_token_expira) < new Date()) {
            return res.status(400).json({ message: "El enlace de recuperación expiró. Solicita uno nuevo." });
        }

        const contrasenaEncriptada = await bcrypt.hash(nueva_contrasena, 10);
        await usuariosModelo.actualizarContrasena(usuario.numero_identidad, contrasenaEncriptada);

        res.json({ message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};