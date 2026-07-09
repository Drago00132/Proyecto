const db = require('../config/db');

const distribuidor = {
    findAll: async () => {
        const [rows] = await db.query(`SELECT * FROM distribuidores`);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`SELECT * FROM distribuidores WHERE id_distribuidor = ?`, [id]);
        if (!rows[0]) return null;

        const [repuestos] = await db.query(`
            SELECT r.id_repuestos, r.nombre_repuesto
            FROM repuesto_distribuidor rd
            JOIN repuestos r ON rd.id_repuestos = r.id_repuestos
            WHERE rd.id_distribuidor = ?
        `, [id]);

        return { ...rows[0], repuestos };
    },

    create: async (data) => {
        const { nombre_distribuidor, telefono, correo, direccion, contacto } = data;
        const [result] = await db.query(
            'INSERT INTO distribuidores (nombre_distribuidor, telefono, correo, direccion, contacto) VALUES (?,?,?,?,?)',
            [nombre_distribuidor, telefono, correo, direccion, contacto]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { nombre_distribuidor, telefono, correo, direccion, contacto } = data;
        await db.query(
            'UPDATE distribuidores SET nombre_distribuidor = ?, telefono = ?, correo = ?, direccion = ?, contacto = ? WHERE id_distribuidor = ?',
            [nombre_distribuidor, telefono, correo, direccion, contacto, id]
        );
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM repuesto_distribuidor WHERE id_distribuidor = ?', [id]);
        await db.query('DELETE FROM distribuidores WHERE id_distribuidor = ?', [id]);
        return true;
    }
};

module.exports = distribuidor;