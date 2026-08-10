const db = require('../config/db');

const authModelo = {
    buscarPorCorreo: async (correo) => {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE correo_electronico = ?", [correo]);
        return rows[0];
    },

    incrementarIntentosFallidos: async (numero_identidad) => {
        await db.query(
            "UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE numero_identidad = ?",
            [numero_identidad]
        );
        const [rows] = await db.query(
            "SELECT intentos_fallidos FROM usuarios WHERE numero_identidad = ?",
            [numero_identidad]
        );
        return rows[0].intentos_fallidos;
    },

    bloquearCuenta: async (numero_identidad, minutos) => {
        await db.query(
            "UPDATE usuarios SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL ? MINUTE), intentos_fallidos = 0 WHERE numero_identidad = ?",
            [minutos, numero_identidad]
        );
    },

    resetearIntentos: async (numero_identidad) => {
        await db.query(
            "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE numero_identidad = ?",
            [numero_identidad]
        );
    },

    guardarCodigo2FA: async (numero_identidad, codigo, minutos) => {
        await db.query(
            "UPDATE usuarios SET two_factor_code = ?, two_factor_code_expira = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE numero_identidad = ?",
            [codigo, minutos, numero_identidad]
        );
    },

    limpiarCodigo2FA: async (numero_identidad) => {
        await db.query(
            "UPDATE usuarios SET two_factor_code = NULL, two_factor_code_expira = NULL WHERE numero_identidad = ?",
            [numero_identidad]
        );
    },

    guardarTokenRecuperacion: async (numero_identidad, token, expira) => {
        await db.query(
            "UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE numero_identidad = ?",
            [token, expira, numero_identidad]
        );
    },

    buscarPorTokenRecuperacion: async (token) => {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE reset_token = ?", [token]);
        return rows[0];
    },

    actualizarContrasena: async (numero_identidad, contrasenaEncriptada) => {
        await db.query(
            "UPDATE usuarios SET contrasena = ?, reset_token = NULL, reset_token_expira = NULL WHERE numero_identidad = ?",
            [contrasenaEncriptada, numero_identidad]
        );
    }
};

module.exports = authModelo;