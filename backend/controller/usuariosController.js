const usuario_modelo = require('../model/usuariosModelo');

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await usuario_modelo.findAll();
        const usuariosSinContrasena = usuarios.map(({ contrasena, ...resto }) => resto);
        res.status(200).json(usuariosSinContrasena);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerUsuario = async (req, res) => {
    try {
        const usuario = await usuario_modelo.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        const { contrasena, ...usuarioSinContrasena } = usuario;
        res.status(200).json(usuarioSinContrasena);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.crearUsuario = async (req, res) => {
    const { numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = req.body;

    if (!numero_identidad || !tipo_documento || !nombre || !apellido || !fecha_nacimiento || !numero_celular || !correo_electronico || !contrasena || !id_rol) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const id = await usuario_modelo.create(req.body);
        res.status(201).json({ numero_identidad: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarUsuario = async (req, res) => {
    const { tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, id_rol } = req.body;

    if (!tipo_documento || !nombre || !apellido || !fecha_nacimiento || !numero_celular || !correo_electronico || !id_rol) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes' });
    }

    try {
        const existe = await usuario_modelo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Usuario no encontrado' });

        await usuario_modelo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const existe = await usuario_modelo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Usuario no encontrado' });

        await usuario_modelo.delete(req.params.id);
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};