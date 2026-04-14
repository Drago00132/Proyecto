const db = require('../Config/db');

const tecnico ={
    findAll: async ()=>{
        const[rows] = await db.query('select * from tecnico');
        return rows;
    },

    findById: async(id)=>{
        const[rows]= await db.query('select * from tecnico where id_tecnico = ?',[id]);
        return rows[0];
    },

    create:async(data)=>{
        const {numero_identidad, reparaciones_asignadas}= data;
        const [result] = await db.query('insert into tecnico (numero_identidad,reparaciones_asignadas) values (?,?)',[numero_identidad,reparaciones_asignadas]);
        return result.insertId;
    },

    update: async(id,data)=>{
        const {numero_identidad,reparaciones_asignadas}= data;
        await db.query('update tecnico set numero_identidad = ?, reparaciones_asignadas = ? where id_tecnico = ?',[numero_identidad,reparaciones_asignadas,id]);
        return true;
    },
    
    delete: async(id)=>{
        await db.query('delete from tecnico where id_tecnico = ?',[id]);
        return true;
    }
};

module.exports = tecnico;