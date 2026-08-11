const usuario_modelo = require('../model/usuariosModelo');
const rolModelo = require('../model/RoleModelo');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const manejarError = require('../utils/manejarError');

const ROLES_ASIGNABLES = {
    17: [1, 2, 3, 16, 17], 
    1: [2, 3, 16],
    16: [3], 
};

exports.listarUsuarios = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
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
        manejarError(error, res);
    }
};

exports.obtenerUsuario = async (req, res) => {
    try {
        const usuario = await usuario_modelo.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        const { contrasena, ...usuarioSinContrasena } = usuario;
        res.status(200).json(usuarioSinContrasena);
    } catch (error) {
        manejarError(error, res);
    }
};

exports.crearUsuario = async (req, res) => {
    const { numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, contrasena, id_rol } = req.body;

    if (!numero_identidad || !tipo_documento || !nombre || !fecha_nacimiento || !correo_electronico || !contrasena || !id_rol) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    let rolFinal = Number(id_rol);
    if (!req.usuario) {
        rolFinal = 3;
    } else {
        const idsPermitidos = ROLES_ASIGNABLES[req.usuario.rol] || [];
        if (!idsPermitidos.includes(rolFinal)) {
            return res.status(403).json({ message: 'No tienes permiso para asignar ese rol.' });
        }
    }

    try {
        const id = await usuario_modelo.create({ ...req.body, id_rol: rolFinal });

        // RF-M1.1: si es registro público (sin token), el usuario queda autenticado
        // de una vez, igual que si hubiera iniciado sesión, para poder redirigirlo al panel.
        if (!req.usuario) {
            const token = jwt.sign(
                { id, nombre, rol: rolFinal },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            return res.status(201).json({
                message: 'Usuario registrado exitosamente',
                numero_identidad: id,
                rol: rolFinal,
                token
            });
        }

        res.status(201).json({ numero_identidad: id, ...req.body, id_rol: rolFinal });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.actualizarUsuario = async (req, res) => {
    const { tipo_documento, nombre, apellido, fecha_nacimiento, numero_celular, correo_electronico, id_rol } = req.body;

    if (!tipo_documento || !nombre || !fecha_nacimiento || !correo_electronico || !id_rol) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes' });
    }

    const idsPermitidos = ROLES_ASIGNABLES[req.usuario.rol] || [];
    if (!idsPermitidos.includes(Number(id_rol))) {
        return res.status(403).json({ message: 'No tienes permiso para asignar o gestionar ese rol.' });
    }

    try {
        const existe = await usuario_modelo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Usuario no encontrado' });

        await usuario_modelo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.obtenerRolesAsignables = async (req, res) => {
    try {
        const idsPermitidos = ROLES_ASIGNABLES[req.usuario.rol] || [];
        const todosLosRoles = await rolModelo.findAll();
        const rolesAsignables = todosLosRoles.filter(r => idsPermitidos.includes(r.id_rol));
        res.status(200).json({ roles: rolesAsignables });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
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
        manejarError(error, res);
    }
};

exports.obtenerMiPerfil = async (req, res) => {
    try {
        const usuario = await usuario_modelo.findById(req.usuario.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        const { contrasena, ...usuarioSinContrasena } = usuario;
        res.status(200).json(usuarioSinContrasena);
    } catch (error) {
        manejarError(error, res);
    }
};

exports.actualizarMiPerfil = async (req, res) => {
    const { nombre, apellido, correo_electronico, numero_celular } = req.body;

    if (!nombre || !correo_electronico) {
        return res.status(400).json({ message: 'Nombre y correo electrónico son obligatorios' });
    }

    try {
        await usuario_modelo.updatePerfilPropio(req.usuario.id, { nombre, apellido, correo_electronico, numero_celular });
        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.cargaMasiva = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ningún archivo' });
        }

        console.log("Ruta del archivo temporal:", req.file.path);

        const workbook = xlsx.readFile(req.file.path);
        
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log("Datos procesados:", data);

        for (const usuario of data) {
            await usuario_modelo.create({ ...usuario, id_rol: 2 });
        }

        res.status(200).json({ message: 'Carga masiva de técnicos realizada con éxito' });
    } catch (error) {
        console.error("ERROR CRÍTICO EN CARGA MASIVA:", error);
        manejarError(error, res, 'carga masiva de técnicos');
    }
};