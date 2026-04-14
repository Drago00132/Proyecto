const db = require('../Config/db');
const bcrypt = require('bcrypt');

const usuarios = {

    findAll: async ()=>{
        const [rows] = await db.query('select * FROM usuarios');
        return rows;
    },

    findById: async(id) =>{
        const [rows] = await db.query('select * from usuarios where numero_identidad = ?',[id]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE correo_electronico = ?', [email]);
        return rows[0];
    },

    create: async (data) => {
        const { numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = data;
        
        const saltRounds = 10;
        const contrasenaEncriptada = await bcrypt.hash(contrasena, saltRounds);

        const [result] = await db.query(
            'INSERT INTO usuarios(numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasenaEncriptada, id_rol]
        );
        return result.insertId;
    },

    update: async (id, data) => {
        const { tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = data;
        
        let pass = contrasena;
        if (contrasena) {
            pass = await bcrypt.hash(contrasena, 10);
        }

        await db.query(
            'UPDATE usuarios SET tipo_documento = ?, nombre = ?, apellido = ?, fecha_nacimiento = ?, numero_celular = ?, correo_electronico = ?, contrasena = ?, id_rol = ? WHERE numero_identidad = ?',
            [tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, pass, id_rol, id]
        );
        return true;
    },

    delete: async(id) =>{
        await db.query('DELETE from usuarios where numero_identidad = ?', [id]);
        return true;
    }
};

module.exports = usuarios;