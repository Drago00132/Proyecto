const usuariosModelo = require('../model/auhtModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { correo_electronico, contrasena } = req.body;

    try {
        const usuario = await usuariosModelo.buscarPorCorreo(correo_electronico);

        if (!usuario) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const coinciden = await bcrypt.compare(contrasena, usuario.contrasena);
        
        if (!coinciden) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario.numero_identidad, nombre: usuario.nombre, rol: usuario.id_rol }, 
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
            
        );

        res.json({ message: "Bienvenido", token, rol: usuario.id_rol, numero_identidad: usuario.numero_identidad
});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};