const db = require('../config/db');

const historial = {

    findAll: async () => {
        const [rows] = await db.query(`
            SELECT 
                h.id_historial,
                h.descripcion_prodlema,
                h.estado,
                h.descripcion_trabajo,
                h.fecha_inicio,
                h.fecha_fin,
                m.placa,
                m.modelo_moto,
                u_tecnico.nombre AS nombre_tecnico,
                u_tecnico.apellido AS apellido_tecnico,
                u_cliente.nombre AS nombre_cliente,
                u_cliente.apellido AS apellido_cliente
            FROM historial h
            INNER JOIN motos m ON h.id_motos = m.id_motos
            INNER JOIN tecnico t ON h.id_tecnico = t.id_tecnico
            INNER JOIN usuarios u_tecnico ON t.numero_identidad = u_tecnico.numero_identidad
            INNER JOIN usuarios u_cliente ON h.id_historial_cliente = u_cliente.numero_identidad
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                h.id_historial,
                h.descripcion_prodlema,
                h.estado,
                h.descripcion_trabajo,
                h.fecha_inicio,
                h.fecha_fin,
                m.placa,
                m.modelo_moto,
                u_tecnico.nombre AS nombre_tecnico,
                u_tecnico.apellido AS apellido_tecnico,
                u_cliente.nombre AS nombre_cliente,
                u_cliente.apellido AS apellido_cliente
            FROM historial h
            INNER JOIN motos m ON h.id_motos = m.id_motos
            INNER JOIN tecnico t ON h.id_tecnico = t.id_tecnico
            INNER JOIN usuarios u_tecnico ON t.numero_identidad = u_tecnico.numero_identidad
            INNER JOIN usuarios u_cliente ON h.id_historial_cliente = u_cliente.numero_identidad
            WHERE h.id_historial = ?
        `, [id]);
        return rows[0];
    },

    create: async (data) => {
        const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio } = data;
        const [result] = await db.query(
            'INSERT INTO historial (id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio) VALUES (?,?,?,?,?,?,?)',
            [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, fecha_fin } = data;
        await db.query(
            'UPDATE historial SET id_motos = ?, id_tecnico = ?, id_historial_cliente = ?, descripcion_prodlema = ?, estado = ?, descripcion_trabajo = ?, fecha_inicio = ?, fecha_fin = ? WHERE id_historial = ?',
            [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, fecha_fin, id]
        );
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM historial WHERE id_historial = ?', [id]);
        return true;
    }
};

module.exports = historial;