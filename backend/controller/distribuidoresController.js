const distribuidor_mo = require('../model/distribuidorModelo');
const manejarError = require('../utils/manejarError');

exports.listarDistribuidores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const distribuidores = await distribuidor_mo.findAll();
        const totalItems = distribuidores.length;
        const totalPages = Math.ceil(totalItems / limit);
        const distribuidoresPaginados = distribuidores.slice(offset, offset + limit);
        res.status(200).json({
            distribuidores: distribuidoresPaginados,
            totalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.obtenerDistribuidor = async (req, res) => {
    try {
        const distribuidor = await distribuidor_mo.findById(req.params.id);
        if (!distribuidor) return res.status(404).json({ message: 'Distribuidor no encontrado' });
        res.status(200).json(distribuidor);
    } catch (error) {
        manejarError(error, res);
    }
};

exports.crearDistribuidor = async (req, res) => {
    const { nombre_distribuidor, telefono, correo, direccion, contacto } = req.body;

    if (!nombre_distribuidor) {
        return res.status(400).json({ message: 'nombre_distribuidor es obligatorio' });
    }

    try {
        const id = await distribuidor_mo.create(req.body);
        res.status(201).json({ id_distribuidor: id, ...req.body });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.actualizarDistribuidor = async (req, res) => {
    const { nombre_distribuidor, telefono, correo, direccion, contacto } = req.body;

    if (!nombre_distribuidor) {
        return res.status(400).json({ message: 'nombre_distribuidor es obligatorio' });
    }

    try {
        const existe = await distribuidor_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Distribuidor no encontrado' });

        await distribuidor_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Distribuidor actualizado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.eliminarDistribuidor = async (req, res) => {
    try {
        const existe = await distribuidor_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Distribuidor no encontrado' });

        await distribuidor_mo.delete(req.params.id);
        res.status(200).json({ message: 'Distribuidor eliminado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};