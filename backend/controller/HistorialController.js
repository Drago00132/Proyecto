const historial_mo = require('../model/historialModelo');

exports.listarHistrial = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const esAdmin = req.usuario.rol === 1;
        const filtroIdentidad = esAdmin ? null : req.usuario.id;

        const filas = await historial_mo.findAll(filtroIdentidad);

        const historialAgrupado = Object.values(filas.reduce((acc, row) => {
            if (!acc[row.id_historial]) {
                acc[row.id_historial] = {
                    id_historial: row.id_historial,
                    id_motos: row.id_motos,
                    id_tecnico: row.id_tecnico,
                    id_historial_cliente: row.id_historial_cliente,
                    descripcion_prodlema: row.descripcion_prodlema,
                    estado: row.estado,
                    descripcion_trabajo: row.descripcion_trabajo,
                    fotos: row.fotos,
                    fecha_inicio: row.fecha_inicio,
                    fecha_fin: row.fecha_fin,
                    placa: row.placa,
                    modelo_moto: row.modelo_moto,
                    nombre_tecnico: row.nombre_tecnico,
                    apellido_tecnico: row.apellido_tecnico,
                    nombre_cliente: row.nombre_cliente,
                    apellido_cliente: row.apellido_cliente,
                    repuestos: []
                };
            }

            if (row.nombre_repuesto) {
                acc[row.id_historial].repuestos.push({
                    nombre: row.nombre_repuesto,
                    cantidad: row.cantidad
                });
            }

            return acc;
        }, {}));

        const totalItems = historialAgrupado.length;
        const totalPages = Math.ceil(totalItems / limit);
        const historialPaginados = historialAgrupado.slice(offset, offset + limit);

        res.status(200).json({
            historial: historialPaginados,
            totalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerHistorial = async (req, res) => {
    try {
        const historial = await historial_mo.findById(req.params.id);
        if (!historial) return res.status(404).json({ message: 'Historial no encontrado' });
        
        const repuestos = await historial_mo.getRepuestosByHistorial(req.params.id);
        historial.repuestos = repuestos; 

        res.status(200).json(historial);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.agregarHistorial = async (req, res) => {
    const { id_motos, id_tecnico, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, repuestos } = req.body;

    if (!id_motos || !descripcion_prodlema || !fecha_inicio) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const fotoNombre = req.file ? req.file.filename : null;

        let repuestosParsed = [];
        if (repuestos) {
            repuestosParsed = typeof repuestos === 'string' ? JSON.parse(repuestos) : repuestos;
        }

        const dataInsert = {
            ...req.body,
            id_motos,
            id_tecnico: id_tecnico === 'null' ? null : id_tecnico,
            descripcion_trabajo: descripcion_trabajo === 'null' ? null : descripcion_trabajo,
            fotos: fotoNombre,
            repuestos: repuestosParsed
        };

        const id = await historial_mo.create(dataInsert);
        res.status(201).json({ id_historial: id, ...dataInsert });
    } catch (error) {
        console.log("EL ERROR ES:", error);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarHistorial = async (req, res) => {
    const { id_motos, id_tecnico, id_historial_cliente, descripcion_prodlema, estado, descripcion_trabajo, fecha_inicio, fecha_fin, repuestos } = req.body;

    if (!id_motos || !descripcion_prodlema || !fecha_inicio) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes' });
    }

    try {
        const existe = await historial_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Historial no encontrado' });

        const fotoNombre = req.file ? req.file.filename : existe.fotos;

        let repuestosParsed = [];
        if (repuestos) {
            repuestosParsed = typeof repuestos === 'string' ? JSON.parse(repuestos) : repuestos;
        }

        const dataUpdate = {
            id_motos,
            id_tecnico: id_tecnico === 'null' ? null : id_tecnico,
            id_historial_cliente: id_historial_cliente === 'null' ? null : id_historial_cliente,
            descripcion_prodlema,
            estado,
            descripcion_trabajo: descripcion_trabajo === 'null' ? null : descripcion_trabajo,
            fotos: fotoNombre,
            fecha_inicio,
            fecha_fin: fecha_fin === 'null' || !fecha_fin ? null : fecha_fin,
            repuestos: repuestosParsed
        };

        await historial_mo.update(req.params.id, dataUpdate);
        res.status(200).json({ message: 'Historial actualizado correctamente' });
    } catch (error) {
        console.log("EL ERROR ES:", error);
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