const db = require('../config/db');
const bcrypt = require('bcrypt');

const usuarios = {

    findAll: async () => {
        const [rows] = await db.query('SELECT * FROM usuarios');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE numero_identidad = ?', [id]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE correo_electronico = ?', [email]);
        return rows[0];
    },

    create: async (data) => {
        const { numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = data;

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        const [result] = await db.query(
            'INSERT INTO usuarios(numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasenaEncriptada, id_rol]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = data;

        if (contrasena) {
            const pass = await bcrypt.hash(contrasena, 10);
            await db.query(
                'UPDATE usuarios SET tipo_documento = ?, nombre = ?, apellido = ?, fecha_nacimiento = ?, numero_celular = ?, correo_electronico = ?, contrasena = ?, id_rol = ? WHERE numero_identidad = ?',
                [tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, pass, id_rol, id]
            );
        } else {
            await db.query(
                'UPDATE usuarios SET tipo_documento = ?, nombre = ?, apellido = ?, fecha_nacimiento = ?, numero_celular = ?, correo_electronico = ?, id_rol = ? WHERE numero_identidad = ?',
                [tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, id_rol, id]
            );
        }
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM usuarios WHERE numero_identidad = ?', [id]);
        return true;
    },

    updatePerfilPropio: async (id, data) => {
        const { nombre, apellido, correo_electronico, numero_celular } = data;
        await db.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, correo_electronico = ?, numero_celular = ? WHERE numero_identidad = ?',
            [nombre, apellido, correo_electronico, numero_celular, id]
        );
        return true;
    },

    // Mi perfil de Administrador (1) y Súper Administrador (17): además de los
    // datos de contacto, pueden cambiar su documento, tipo de documento y fecha
    // de nacimiento. Si cambia numero_identidad, las tablas que apuntan a él
    // (motos, entrada_repuestos, tecnico) se actualizan solas gracias a
    // ON UPDATE CASCADE (ver migracion_on_update_cascade.sql).
    updatePerfilAdmin: async (idActual, data) => {
        const { numero_identidad, tipo_documento, fecha_nacimiento, nombre, apellido, correo_electronico, numero_celular } = data;
        await db.query(
            'UPDATE usuarios SET numero_identidad = ?, tipo_documento = ?, fecha_nacimiento = ?, nombre = ?, apellido = ?, correo_electronico = ?, numero_celular = ? WHERE numero_identidad = ?',
            [numero_identidad, tipo_documento, fecha_nacimiento, nombre, apellido, correo_electronico, numero_celular, idActual]
        );
        return true;
    }
};

module.exports = usuarios;