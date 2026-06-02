const repuesto_mo = require('../model/repuestoModelo');

exports.listarRepuest = async (req, res) => {
    try {
        const repuesto = await repuesto_mo.findAll();
        res.status(200).json(repuesto);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerRepuestos = async (req, res) => {
    try {
        const repuesto = await repuesto_mo.findById(req.params.id);
        if (!repuesto) return res.status(404).json({ message: 'Repuesto no encontrado' });
        res.status(200).json(repuesto);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.crearRepuesto = async (req, res) => {
    const { nombre_repuesto, cantidad } = req.body;

    if (!nombre_repuesto || cantidad === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const id = await repuesto_mo.create(req.body);
        res.status(201).json({ id_repuestos: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarRepuesto = async (req, res) => {
    const { nombre_repuesto, cantidad } = req.body;

    if (!nombre_repuesto || cantidad === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const existe = await repuesto_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Repuesto no encontrado' });

        await repuesto_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Repuesto actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
};