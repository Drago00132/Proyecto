const db = require('../Config/db');
const { findById } = require('./usuariosModelo');

const moto ={
    findAll: async ()=>{
        const [rows] = await db.query('select * from motos');
        return rows;
    },

    findById: async (id)=>{
        const [rows] = await db.query('select * from motos where id_motos = ?',[id])
        return rows[0];
    },

    create: async(data)=>{
        const {numero_identidad, marca_moto, modelo_moto, placa} = data;
        const [result] = await db.query('insert into motos (numero_identidad, marca_moto, modelo_moto, placa) values (?,?,?,?)',
            [numero_identidad, marca_moto, modelo_moto, placa]);
        return result.insertId;
    },

    update: async(id, data) =>{
        const {numero_identidad,marca_moto,modelo_moto,placa} = data;
        await db.query('update motos set numero_identidad =?, marca_moto =?, modelo_moto =?, placa =? where id_motos = ?',
            [numero_identidad, marca_moto, modelo_moto, placa, id]);
        return true;
    },
    delete: async(id)=>{
        await db.query('delete from motos where id_motos =?',[id]);
        return true;
    }
};

module.exports = moto;