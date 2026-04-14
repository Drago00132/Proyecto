const db = require('../Config/db');

const historial = {
    findAll: async()=>{
        const [rows]= await db.query('select * from historial');
        return rows;
    },

    findById: async(id)=>{
        const [rows]= await db.query('select * from historial where id_historial =?',[id]);
        return rows[0];
    },

    create: async(data)=>{
        const {id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio}= data;
        const [result]= await db.query('insert into historial (id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio) values (?,?,?,?,?,?,?)',
            [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio]);
        return result.insertId;
    },

    update: async(id,data)=>{
        const {id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, fecha_fin}= data;
        await db.query('update historial set id_motos = ?, id_tecnico = ?, id_historial_cliente = ?, descripcion_prodlema = ?, estado = ?, descripcion_trabajo = ?, fecha_inicio = ?, fecha_fin =? where id_historial',
        [id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, fecha_fin,id]);
        return true;
    },

    delete: async(id)=>{
        await db.query('delete from historial where id_historial = ?',[id]);
        return true;
    }
};

module.exports = historial;