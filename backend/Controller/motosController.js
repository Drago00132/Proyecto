const motos_mo = require('../Model/motosModelo');

exports.listarMotos = async(req, res)=>{
    try {
        const motos = await motos_mo.findAll();
        res.json(motos);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.obtenerMotos = async(req, res) =>{
    try {
        const motos= await motos_mo.findById(req.params.id);
        if(!motos)return res.status(404).json({message: 'Moto no encontrada'});
        res.json(motos);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.crearMoto = async ( req, res) =>{
    try {
        const id= await motos_mo.create(req.body);
        res.status(201).json({id_moto: id, ...req.body});
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
};

exports.actualizarMoto = async(req, res) =>{
    try {
        await motos_mo.update(req.params.id, req.body);
        res.json({ message:'Moto actualizada correctamente'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

exports.eliminarMotos = async(req, res) =>{
    try {
        await motos_mo.delete(req.params.id);
        res.json({message: 'moto elimanda correctamente'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};