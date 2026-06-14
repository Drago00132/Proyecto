const usuario_modelo = require('../model/usuariosModelo');
const xlsx = require('xlsx');

exports.listarUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const usuarios = await usuario_modelo.findAll();
        const usuariosSinContrasena = usuarios.map(({ contrasena, ...resto }) => resto);
        const totalItems = usuariosSinContrasena.length;
        const totalPages = Math.ceil(totalItems / limit);
        const usuariosPaginados = usuariosSinContrasena.slice(offset, offset + limit);
        res.status(200).json({
            usuarios: usuariosPaginados,
            totalItems,
            totalPages,
            currentPage: page
        });
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

    if (!numero_identidad || !tipo_documento || !nombre || !fecha_nacimiento || !correo_electronico || !contrasena || !id_rol) {
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

    if (!tipo_documento || !nombre || !fecha_nacimiento || !correo_electronico || !id_rol) {
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

exports.cargaMasiva = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ningún archivo' });
        }

        console.log("Ruta del archivo temporal:", req.file.path);

        const workbook = xlsx.readFile(req.file.path);
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log("Datos procesados:", data);

        for (const usuario of data) {
            await usuario_modelo.create(usuario);
        }

        res.status(200).json({ message: 'Carga masiva realizada con éxito' });
    } catch (error) {
        console.error("ERROR CRÍTICO EN CARGA MASIVA:", error);
        res.status(500).json({ message: 'Error interno al procesar el archivo', error: error.message });
    }
};