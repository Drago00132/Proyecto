const Rol_modelo = require('../Model/RoleModelo');

exports.ListarRol= async(req,res) =>{
    try{
        const rol = await Rol_modelo.findAll();
        res.json(rol);
    }catch(error) {
        res.status(500).json({error: error.menssage});
    }
};

exports.obtenerRol= async (req,res) =>{
    try{
        const rol = await Rol_modelo.findById(req.params.id);
        if(!rol) return res.status(404).json({menssage: 'rol no encontrado'});
        res.json(rol);
    }catch (error) {
        res.status(500).json({error: error.menssage});
    }
};

exports.crearRol= async (req,res) =>{
    try{
        const id = await Rol_modelo.create(req.body);
        res.status(201).json({id_rol: id, ...req.body});
    }catch (error) {
        res.status(500).json({error: error.menssage});
    }
};

exports.actualizarRol= async (req, res)=>{
    try{
        await Rol_modelo.update(req.params.id,req.body);
        res.json({menssage:'Rol actualizado correctamente'});
    }catch (error) {
        res.status(500).json({error: error.menssage});
    }
};

exports.eliminarRol =async (req, res) =>{
    try{
        await Rol_modelo.delete(req.params.id);
        res.json({menssage:'Rol eliminado correctamente'});
    }catch (error) {
        res.status(500).json({error: error.menssage});
    }
};