const db = require('../config/db');

const entradaRepuesto = {
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT
                e.id_entrada,
                e.fecha_entrada,
                e.cantidad_ingresada,
                r.id_repuestos,
                r.nombre_repuesto,
                d.id_distribuidor,
                d.nombre_distribuidor,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM entrada_repuestos e
            LEFT JOIN repuestos r ON e.id_repuestos = r.id_repuestos
            LEFT JOIN distribuidores d ON e.id_distribuidor = d.id_distribuidor
            LEFT JOIN usuarios u ON e.numero_identidad = u.numero_identidad
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT
                e.id_entrada,
                e.fecha_entrada,
                e.cantidad_ingresada,
                r.id_repuestos,
                r.nombre_repuesto,
                d.id_distribuidor,
                d.nombre_distribuidor,
                u.numero_identidad,
                u.nombre,
                u.apellido
            FROM entrada_repuestos e
            LEFT JOIN repuestos r ON e.id_repuestos = r.id_repuestos
            LEFT JOIN distribuidores d ON e.id_distribuidor = d.id_distribuidor
            LEFT JOIN usuarios u ON e.numero_identidad = u.numero_identidad
            WHERE e.id_entrada = ?
        `, [id]);
        return rows[0];
    },

    create: async (data) => {
        const { fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad } = data;
        const [result] = await db.query(
            'INSERT INTO entrada_repuestos (fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad) VALUES (?,?,?,?,?)',
            [fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad } = data;
        await db.query(
            'UPDATE entrada_repuestos SET fecha_entrada = ?, cantidad_ingresada = ?, id_repuestos = ?, id_distribuidor = ?, numero_identidad = ? WHERE id_entrada = ?',
            [fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad, id]
        );
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM entrada_repuestos WHERE id_entrada = ?', [id]);
        return true;
    }
};

module.exports = entradaRepuesto;