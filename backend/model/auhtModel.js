const db = require('../config/db');

const authModelo = {
    buscarPorCorreo: async (correo) => {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE correo_electronico = ?", [correo]);
        return rows[0];
    }
};

module.exports = authModelo;