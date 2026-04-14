const repuesto_mo = require('../Model/repuestoModelo');

exports.listarRepuest= async(req,res)=>{
    try {
        const repuesto = await repuesto_mo.findAll();
        res.json(repuesto);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.obtenerRepuestos = async(req,res)=>{
    try {
        const repuesto = await repuesto_mo.findById(req.params.id);
        if(!repuesto) return res.status(404).json({message:'repuesto no encontrado'});
        res.json(repuesto);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.crearRepuesto= async( req, res)=>{
    try {
        const id = await repuesto_mo.create(req.body);
        res.status(201).json({id_repuestos: id, ...req.body});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.actualizarRepuesto = async(req, res)=>{
    try {
        await repuesto_mo.update(req.params.id, req.body);
        res.json({message: 'repuesto actializado correctamente'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.eliminarRepuesto = async(req, res)=>{
    try {
        await repuesto_mo.delete(req.params.id);
        res.json({message: 'repuesto eliminado correctamente'})
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}