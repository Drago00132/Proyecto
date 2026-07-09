const db = require('../config/db');

const repuesto = {
    findAll: async()=>{
        const [rows] = await db.query('select * from repuestos');
        return rows;
    },

    findById: async(id) =>{
        const [rows] = await db.query('select * from repuestos where id_repuestos =?',[id]);
        return rows[0];
    },

    create: async(data)=>{
        const { nombre_repuesto, cantidad}= data;
        const [result]= await db.query('insert into repuestos (nombre_repuesto, cantidad) values (?,?)',[nombre_repuesto, cantidad]);
        return result.insertId;
    },

    update: async(id,data)=>{
        const { nombre_repuesto, cantidad} = data;
        await db.query('update repuestos set nombre_repuesto =?, cantidad = ? where id_repuestos = ?',[nombre_repuesto,cantidad,id]);
        return true;
    },
    
    delete: async(id)=>{
        await db.query('DELETE FROM repuesto_distribuidor WHERE id_repuestos = ?', [id]);
        await db.query('delete from repuestos where id_repuestos =?',[id]);
        return true;
    }
};

module.exports = repuesto;