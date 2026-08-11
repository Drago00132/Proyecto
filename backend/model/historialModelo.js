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
                h.fotos,
                h.fecha_inicio,
                h.fecha_fin,
                m.placa,
                m.modelo_moto,
                u_tecnico.nombre AS nombre_tecnico,
                u_tecnico.apellido AS apellido_tecnico,
                u_cliente.nombre AS nombre_cliente,
                u_cliente.apellido AS apellido_cliente,
                rp.nombre_repuesto,
                rh.cantidad
            FROM historial h
            LEFT JOIN motos m ON h.id_motos = m.id_motos
            LEFT JOIN tecnico t ON h.id_tecnico = t.id_tecnico
            LEFT JOIN usuarios u_tecnico ON t.numero_identidad = u_tecnico.numero_identidad
            LEFT JOIN usuarios u_cliente ON m.numero_identidad = u_cliente.numero_identidad
            LEFT JOIN repuestos_historial rh ON h.id_historial = rh.id_historial
            LEFT JOIN repuestos rp ON rh.id_repuestos = rp.id_repuestos
        `;

        const params = [];

        if (numero_identidad) {
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
                h.fotos,
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
    const { id_motos, id_tecnico, descripcion_prodlema, estado, descripcion_trabajo, fotos, fecha_inicio, repuestos } = data;
    
    const [rows] = await db.query(
        'SELECT COUNT(*) AS total FROM historial WHERE id_motos = ?',
        [id_motos]
    );
    const id_historial_cliente = rows[0].total + 1;
    
    const [result] = await db.query(
        'INSERT INTO historial (id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fotos, fecha_inicio) VALUES (?,?,?,?,?,?,?,?)',
        [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fotos, fecha_inicio]
    );
    
    const nuevo_id_historial = result.insertId;

    if (repuestos && repuestos.length > 0) {
        for (const rep of repuestos) {
            if(rep.id_repuestos !== "") { 
                await db.query(
                    'INSERT INTO repuestos_historial (id_historial, id_repuestos, cantidad) VALUES (?, ?, ?)',
                    [nuevo_id_historial, rep.id_repuestos, rep.cantidad]
                );
            }
        }
    }

    return nuevo_id_historial;
    },

    getRepuestosByHistorial: async (id_historial) => {
        const [rows] = await db.query(
            'SELECT id_repuestos, cantidad FROM repuestos_historial WHERE id_historial = ?',
            [id_historial]
        );
        return rows;
    },

    tieneHistorialActivo: async (id_motos) => {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS total FROM historial WHERE id_motos = ? AND (estado IS NULL OR estado <> 'Finalizado')",
            [id_motos]
        );
        return rows[0].total > 0;
    },

    update: async (id, data) => {
    const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fotos, fecha_inicio, fecha_fin, repuestos } = data;
    
    await db.query(
        'UPDATE historial SET id_motos = ?, id_tecnico = ?, id_historial_cliente = ?, descripcion_prodlema = ?, estado = ?, descripcion_trabajo = ?, fotos = ?, fecha_inicio = ?, fecha_fin = ? WHERE id_historial = ?',
        [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fotos, fecha_inicio, fecha_fin, id]
    );

    await db.query('DELETE FROM repuestos_historial WHERE id_historial = ?', [id]);

    if (repuestos && repuestos.length > 0) {
        for (const rep of repuestos) {
            if (rep.id_repuestos !== "") {
                await db.query(
                    'INSERT INTO repuestos_historial (id_historial, id_repuestos, cantidad) VALUES (?, ?, ?)',
                    [id, rep.id_repuestos, rep.cantidad]
                );
            }
        }
    }
    return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM historial WHERE id_historial = ?', [id]);
        return true;
    }
};

module.exports = historial;