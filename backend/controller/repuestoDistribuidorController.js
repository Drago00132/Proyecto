const rd_mo = require('../model/repuestoDistribuidorModelo');

exports.listarRelaciones = async (req, res) => {
    try {
        const relaciones = await rd_mo.findAll();
        res.status(200).json({ relaciones });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.listarPorDistribuidor = async (req, res) => {
    try {
        const relaciones = await rd_mo.findByDistribuidor(req.params.id_distribuidor);
        res.status(200).json({ relaciones });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerPorRepuesto = async (req, res) => {
    try {
        const relacion = await rd_mo.findByRepuesto(req.params.id_repuestos);
        res.status(200).json(relacion);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.asignarDistribuidor = async (req, res) => {
    const { id_repuestos, id_distribuidor } = req.body;
    if (!id_repuestos || !id_distribuidor) {
        return res.status(400).json({ message: 'id_repuestos e id_distribuidor son obligatorios' });
    }
    try {
        const id = await rd_mo.asignar(id_repuestos, id_distribuidor);
        res.status(200).json({ id_repuesto_distribuidor: id, id_repuestos, id_distribuidor });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.crearRelacion = async (req, res) => {
    const { id_repuestos, id_distribuidor } = req.body;

    if (!id_repuestos || !id_distribuidor) {
        return res.status(400).json({ message: 'id_repuestos e id_distribuidor son obligatorios' });
    }

    try {
        const id = await rd_mo.create(req.body);
        res.status(201).json({ id_repuesto_distribuidor: id, ...req.body });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ese repuesto ya está vinculado a ese distribuidor' });
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarRelacion = async (req, res) => {
    try {
        await rd_mo.delete(req.params.id);
        res.status(200).json({ message: 'Relación eliminada correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};