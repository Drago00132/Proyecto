const repuesto_mo = require('../model/repuestoModelo');
const manejarError = require('../utils/manejarError');

exports.listarRepuest = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const repuesto = await repuesto_mo.findAll();
        const totalItems = repuesto.length;
        const totalPages = Math.ceil(totalItems / limit);
        const repuestosPaginados = repuesto.slice(offset, offset + limit);
        res.status(200).json({
            repuesto: repuestosPaginados,
            totalItems,
            totalPages,
            currentPage: page});
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.obtenerRepuestos = async (req, res) => {
    try {
        const repuesto = await repuesto_mo.findById(req.params.id);
        if (!repuesto) return res.status(404).json({ message: 'Repuesto no encontrado' });
        res.status(200).json(repuesto);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.buscarPorNombre = async (req, res) => {
    const nombre = (req.query.nombre || '').trim();

    if (!nombre) {
        return res.status(400).json({ message: 'Debes ingresar un nombre para buscar' });
    }

    try {
        const resultados = await repuesto_mo.findByNombre(nombre);
        if (resultados.length === 0) {
            return res.status(404).json({ message: 'producto no encontrado' });
        }
        res.status(200).json({ repuesto: resultados });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.crearRepuesto = async (req, res) => {
    const { nombre_repuesto, cantidad } = req.body;

    if (!nombre_repuesto || cantidad === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número mayor o igual a 0' });
    }

    try {
        const id = await repuesto_mo.create(req.body);
        res.status(201).json({ id_repuestos: id, ...req.body });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe un repuesto con ese nombre' });
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.actualizarRepuesto = async (req, res) => {
    const { nombre_repuesto, cantidad } = req.body;

    if (!nombre_repuesto || cantidad === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número mayor o igual a 0' });
    }

    try {
        const existe = await repuesto_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Repuesto no encontrado' });

        await repuesto_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Repuesto actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe un repuesto con ese nombre' });
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.eliminarRepuesto = async (req, res) => {
    try {
        const existe = await repuesto_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Repuesto no encontrado' });

        await repuesto_mo.delete(req.params.id);
        res.status(200).json({ message: 'Repuesto eliminado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};