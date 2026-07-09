const db = require('../config/db');

const repuestoDistribuidor = {
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT
                rd.id_repuesto_distribuidor,
                r.id_repuestos,
                r.nombre_repuesto,
                d.id_distribuidor,
                d.nombre_distribuidor
            FROM repuesto_distribuidor rd
            JOIN repuestos r ON rd.id_repuestos = r.id_repuestos
            JOIN distribuidores d ON rd.id_distribuidor = d.id_distribuidor
        `);
        return rows;
    },

    findByDistribuidor: async (id_distribuidor) => {
        const [rows] = await db.query(`
            SELECT
                rd.id_repuesto_distribuidor,
                r.id_repuestos,
                r.nombre_repuesto
            FROM repuesto_distribuidor rd
            JOIN repuestos r ON rd.id_repuestos = r.id_repuestos
            WHERE rd.id_distribuidor = ?
        `, [id_distribuidor]);
        return rows;
    },

    findByRepuesto: async (id_repuestos) => {
    const [rows] = await db.query(`
        SELECT rd.id_repuesto_distribuidor, d.id_distribuidor, d.nombre_distribuidor
        FROM repuesto_distribuidor rd
        JOIN distribuidores d ON rd.id_distribuidor = d.id_distribuidor
        WHERE rd.id_repuestos = ?
    `, [id_repuestos]);
    return rows[0] || null;
    },

    asignar: async (id_repuestos, id_distribuidor) => {
        await db.query('DELETE FROM repuesto_distribuidor WHERE id_repuestos = ?', [id_repuestos]);
        const [result] = await db.query(
            'INSERT INTO repuesto_distribuidor (id_repuestos, id_distribuidor) VALUES (?,?)',
            [id_repuestos, id_distribuidor]
        );
        return result.insertId;
    },

    create: async (data) => {
        const { id_repuestos, id_distribuidor } = data;
        const [result] = await db.query(
            'INSERT INTO repuesto_distribuidor (id_repuestos, id_distribuidor) VALUES (?,?)',
            [id_repuestos, id_distribuidor]
        );
        return result.insertId;
    },

    delete: async (id) => {
        await db.query('DELETE FROM repuesto_distribuidor WHERE id_repuesto_distribuidor = ?', [id]);
        return true;
    }
};

module.exports = repuestoDistribuidor;