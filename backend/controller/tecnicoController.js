const tecnico_mo = require('../model/tecnicoModelo');
const manejarError = require('../utils/manejarError');

exports.ListarTecnico = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1 ) * limit;
        const tecnico = await tecnico_mo.findAll();
        const totgalItems = tecnico.length;
        const totalPages = Math.ceil(totgalItems / limit);
        const tecnicosPaginados = tecnico.slice(offset, offset + limit);
        res.status(200).json({
            tecnico: tecnicosPaginados,
            totgalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.obtenerTecnico = async (req, res) => {
    try {
        const tecnico = await tecnico_mo.findById(req.params.id);
        if (!tecnico) return res.status(404).json({ message: 'Técnico no encontrado' });
        res.status(200).json(tecnico);
    } catch (error) {
        manejarError(error, res);
    }
};

exports.agregarTecnico = async (req, res) => {
    const { numero_identidad, reparaciones_asignadas } = req.body;

    if (!numero_identidad || reparaciones_asignadas === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const id = await tecnico_mo.create(req.body);
        res.status(201).json({ id_tecnico: id, ...req.body });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.actializarTecnico = async (req, res) => {
    const { numero_identidad, reparaciones_asignadas } = req.body;

    if (!numero_identidad || reparaciones_asignadas === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const existe = await tecnico_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Técnico no encontrado' });

        await tecnico_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Técnico actualizado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.eliminarTecnico = async (req, res) => {
    try {
        const existe = await tecnico_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Técnico no encontrado' });

        await tecnico_mo.delete(req.params.id);
        res.status(200).json({ message: 'Técnico eliminado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};