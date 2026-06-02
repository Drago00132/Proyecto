const db = require('../config/db');

const tecnico = {

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT
                t.id_tecnico,
                t.reparaciones_asignadas,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM tecnico t
            INNER JOIN usuarios u ON t.numero_identidad = u.numero_identidad
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT
                t.id_tecnico,
                t.reparaciones_asignadas,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM tecnico t
            INNER JOIN usuarios u ON t.numero_identidad = u.numero_identidad
            WHERE t.id_tecnico = ?
        `, [id]);
        return rows[0];
    },

    create: async (data) => {
        const { numero_identidad, reparaciones_asignadas } = data;
        const [result] = await db.query(
            'INSERT INTO tecnico (numero_identidad, reparaciones_asignadas) VALUES (?,?)',
            [numero_identidad, reparaciones_asignadas]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { numero_identidad, reparaciones_asignadas } = data;
        await db.query(
            'UPDATE tecnico SET numero_identidad = ?, reparaciones_asignadas = ? WHERE id_tecnico = ?',
            [numero_identidad, reparaciones_asignadas, id]
        );
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM tecnico WHERE id_tecnico = ?', [id]);
        return true;
    }
};

module.exports = tecnico;