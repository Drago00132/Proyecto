const db = require('../config/db');

const roles ={

    findAll: async() =>{
        const [rows] = await db.query('select * from roles');
        return rows;
    },

    findById: async(id) =>{
        const [rows]= await db.query('select * from roles where id_rol = ?', [id]);
        return rows[0];
    }, 

    create: async(data) =>{
        const {rol} = data;
        const [result]= await db.query('insert into roles (rol) values (?)', [rol]);
        return result.insertId;
    },

    update: async(id,data)=>{
        const {rol}= data;
        await db.query('update roles set rol =? where id_rol = ?',[rol,id]);
        return true;
    },

    delete: async (id)=>{
        await db.query('delete from roles where id_rol =?',[id]);
        return true;
    },

    contarUsuariosPorRol: async (id) => {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM usuarios WHERE id_rol = ?', [id]);
        return rows[0].total;
    }

};

module.exports = roles;