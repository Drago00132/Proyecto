const db = require('../config/db');

const moto = {

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT
                m.id_motos,
                m.marca_moto,
                m.modelo_moto,
                m.placa,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM motos m
            INNER JOIN usuarios u ON m.numero_identidad = u.numero_identidad
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT
                m.id_motos,
                m.marca_moto,
                m.modelo_moto,
                m.placa,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM motos m
            INNER JOIN usuarios u ON m.numero_identidad = u.numero_identidad
            WHERE m.id_motos = ?
        `, [id]);
        return rows[0];
    },

    create: async (data) => {
        const { numero_identidad, marca_moto, modelo_moto, placa } = data;
        const [result] = await db.query(
            'INSERT INTO motos (numero_identidad, marca_moto, modelo_moto, placa) VALUES (?,?,?,?)',
            [numero_identidad, marca_moto, modelo_moto, placa]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { numero_identidad, marca_moto, modelo_moto, placa } = data;
        await db.query(
            'UPDATE motos SET numero_identidad = ?, marca_moto = ?, modelo_moto = ?, placa = ? WHERE id_motos = ?',
            [numero_identidad, marca_moto, modelo_moto, placa, id]
        );
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM motos WHERE id_motos = ?', [id]);
        return true;
    }
};

module.exports = moto;