const usuario_modelo = require('../Model/usuariosModelo');

exports.listarUsuarios = async (req, res)=>{
    try{
        const usuario = await usuario_modelo.findAll();
        res.json(usuario);
    } catch(error){
        res.status(500).json({error: error.mensage});
    }
};

exports.obtenerUsuario = async (req, res) => {

    try {
        const usuario = await usuario_modelo.findById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.crearUsuario = async (req, res) => {
    try {
        const id = await usuario_modelo.create(req.body);
        res.status(201).json({ numero_identidad: id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarUsuario = async (req, res) => {

try {
    await usuario_modelo.update(req.params.id, req.body);
        res.json({ message: 'Usuario actualizado correctamente' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        await usuario_modelo.delete(req.params.id);
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};