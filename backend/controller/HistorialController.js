const historial_mo = require('../model/historialModelo');

exports.listarHistrial = async (req, res) => {
    try {
        const historial = await historial_mo.findAll();
        res.status(200).json(historial);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerHistorial = async (req, res) => {
    try {
        const historial = await historial_mo.findById(req.params.id);
        if (!historial) return res.status(404).json({ message: 'Historial no encontrado' });
        res.status(200).json(historial);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.agregarHistorial = async (req, res) => {
    const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio } = req.body;

    if (!id_motos || !id_tecnico || !id_historial_cliente || !descripcion_prodlema || !estado || !descripcion_trabajo || !fecha_inicio) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const id = await historial_mo.create(req.body);
        res.status(201).json({ id_historial: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarHistorial = async (req, res) => {
    const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio } = req.body;

    if (!id_motos || !id_tecnico || !id_historial_cliente || !descripcion_prodlema || !estado || !descripcion_trabajo || !fecha_inicio) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes' });
    }

    try {
        const existe = await historial_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Historial no encontrado' });

        await historial_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Historial actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarHistorial = async (req, res) => {
    try {
        const existe = await historial_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Historial no encontrado' });

        await historial_mo.delete(req.params.id);
        res.status(200).json({ message: 'Historial eliminado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};