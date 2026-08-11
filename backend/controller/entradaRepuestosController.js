const entrada_mo = require('../model/entradaRepuestoModelo');
const manejarError = require('../utils/manejarError');

exports.listarEntradas = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const entradas = await entrada_mo.findAll();
        const totalItems = entradas.length;
        const totalPages = Math.ceil(totalItems / limit);
        const entradasPaginadas = entradas.slice(offset, offset + limit);
        res.status(200).json({
            entradas: entradasPaginadas,
            totalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.obtenerEntrada = async (req, res) => {
    try {
        const entrada = await entrada_mo.findById(req.params.id);
        if (!entrada) return res.status(404).json({ message: 'Entrada no encontrada' });
        res.status(200).json(entrada);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.crearEntrada = async (req, res) => {
    const { fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad } = req.body;

    if (!fecha_entrada || !cantidad_ingresada || !id_repuestos || !id_distribuidor || !numero_identidad) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cantidadNum = Number(cantidad_ingresada);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ message: 'La cantidad ingresada debe ser un número mayor a 0' });
    }

    try {
        const id = await entrada_mo.create(req.body);
        res.status(201).json({ id_entrada: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.actualizarEntrada = async (req, res) => {
    const { fecha_entrada, cantidad_ingresada, id_repuestos, id_distribuidor, numero_identidad } = req.body;

    if (!fecha_entrada || !cantidad_ingresada || !id_repuestos || !id_distribuidor || !numero_identidad) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cantidadNum = Number(cantidad_ingresada);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ message: 'La cantidad ingresada debe ser un número mayor a 0' });
    }

    try {
        const existe = await entrada_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Entrada no encontrada' });

        await entrada_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Entrada actualizada correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.eliminarEntrada = async (req, res) => {
    try {
        const existe = await entrada_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Entrada no encontrada' });

        await entrada_mo.delete(req.params.id);
        res.status(200).json({ message: 'Entrada eliminada correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};