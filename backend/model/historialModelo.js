const db = require('../config/db');

const historial = {

    findAll: async (numero_identidad = null) => {
        let query = `
            SELECT 
                h.id_historial,
                h.id_motos,
                h.id_tecnico,
                h.id_historial_cliente,
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
            LEFT JOIN motos m ON h.id_motos = m.id_motos
            LEFT JOIN tecnico t ON h.id_tecnico = t.id_tecnico
            LEFT JOIN usuarios u_tecnico ON t.numero_identidad = u_tecnico.numero_identidad
            LEFT JOIN usuarios u_cliente ON m.numero_identidad = u_cliente.numero_identidad
        `;

        const params = [];

        if (numero_identidad) {
            /* CORREGIDO: Filtra si el ID del usuario logueado coincide con el dueño de la moto 
               O con el técnico encargado del trabajo */
            query += ` WHERE m.numero_identidad = ? OR t.numero_identidad = ?`;
            params.push(numero_identidad, numero_identidad);
        }

        const [rows] = await db.query(query, params);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT 
                h.id_historial,
                h.id_motos,
                h.id_tecnico,
                h.id_historial_cliente,
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
            LEFT JOIN motos m ON h.id_motos = m.id_motos
            LEFT JOIN tecnico t ON h.id_tecnico = t.id_tecnico
            LEFT JOIN usuarios u_tecnico ON t.numero_identidad = u_tecnico.numero_identidad
            LEFT JOIN usuarios u_cliente ON m.numero_identidad = u_cliente.numero_identidad
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