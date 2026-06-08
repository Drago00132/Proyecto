const Rol_modelo = require('../model/RoleModelo');

exports.ListarRol = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const rol = await Rol_modelo.findAll();
        const totalItems = rol.length;
        const totalPages = Math.ceil(totalItems / limit);
        const rolPaginados = rol.slice(offset, offset + limit);
        res.status(200).json({
            rol: rolPaginados,
            totalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerRol = async (req, res) => {
    try {
        const rol = await Rol_modelo.findById(req.params.id);
        if (!rol) return res.status(404).json({ message: 'Rol no encontrado' });
        res.status(200).json(rol);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.crearRol = async (req, res) => {
    const { rol } = req.body;

    if (!rol) return res.status(400).json({ message: 'El nombre del rol es obligatorio' });

    try {
        const id = await Rol_modelo.create(req.body);
        res.status(201).json({ id_rol: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarRol = async (req, res) => {
    const { rol } = req.body;

    if (!rol) return res.status(400).json({ message: 'El nombre del rol es obligatorio' });

    try {
        const existe = await Rol_modelo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Rol no encontrado' });

        await Rol_modelo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarRol = async (req, res) => {
    try {
        const existe = await Rol_modelo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Rol no encontrado' });

        await Rol_modelo.delete(req.params.id);
        res.status(200).json({ message: 'Rol eliminado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};