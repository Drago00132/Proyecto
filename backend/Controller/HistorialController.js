const historial_mo = require('../Model/historialModelo');

exports.listarHistrial = async(req, res)=>{
    try {
        const historial = await historial_mo.findAll();
        res.json(historial);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.obtenerHistorial= async(req, res)=>{
    try {
        const historial = await historial_mo.findById(req.params.id);
        if(!historial) return res.status(404).json({message: 'histrial no encontrado'});
        res.json(historial);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.agregarHistorial= async(req, res)=>{
    try {
        const id = await historial_mo.create(req.body)
        res.status(201).json({id_historial: id, ...req.body});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.actualizarHistorial= async(req, res)=>{
    try {
        await historial_mo.update(req.params.id, req.body);
        res.json({menssage: 'historail actualizado'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.eliminarHistorial= async(req,res)=>{
    try {
        await historial_mo.delete(req.params.id);
        res.json({menssage: 'histrial eliminado'})
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};