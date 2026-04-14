const tecnico_mo = require('../Model/tecnicoModelo');

exports.ListarTecnico = async(req, res)=>{
    try {
        const tecnico = await tecnico_mo.findAll();
        res.json(tecnico);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.obtenerTecnico= async( req, res)=>{
    try {
        const tecnico = await tecnico_mo.findById(req.params.id);
        if(!tecnico) return res.status(404).json({message: 'tecnico no encontrado'});
        res.json(tecnico);
    } catch (error) {
        console.log(" error");
        console.error(error.message);
        console.error(error.stack);
        res.status(500).json({error: error.message});
    }
};

exports.agregarTecnico= async(req, res)=>{
    try {
        const id = await tecnico_mo.create(req.body);
        res.status(201).json({id_tecnico: id, ...req.body});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.actializarTecnico= async(req, res)=>{
    try {
        await tecnico_mo.update(req.params.id,req.body);
        res.json({message: 'tecnico atualizado'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.eliminarTecnico= async(req, res)=>{
    try {
        await tecnico_mo.delete(req.params.id);
        res.json({message: 'Tecnico eliminado'})
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};