const historial_mo = require('../model/historialModelo');
const manejarError = require('../utils/manejarError');

const CAMPOS_EDITABLES_POR_ROL = {
    1: ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'estado', 'descripcion_trabajo', 'fecha_inicio', 'fecha_fin', 'repuestos', 'fotos'],
    17: ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'estado', 'descripcion_trabajo', 'fecha_inicio', 'fecha_fin', 'repuestos', 'fotos'],
    2: ['estado', 'descripcion_trabajo', 'repuestos', 'fotos'], 
    16: ['id_tecnico'], 
    3: ['descripcion_prodlema', 'fotos'],
};

const CAMPOS_CREACION_POR_ROL = {
    1: ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'estado', 'descripcion_trabajo', 'repuestos', 'fotos'],
    17: ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'estado', 'descripcion_trabajo', 'repuestos', 'fotos'],
    16: ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'fotos'],
    3: ['id_motos', 'descripcion_prodlema', 'fotos'],
};

exports.listarHistrial = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const veTodoElHistorial = [1, 16, 17].includes(req.usuario.rol);
        const filtroIdentidad = veTodoElHistorial ? null : req.usuario.id;

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
        manejarError(error, res);
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
        manejarError(error, res);
    }
};

exports.agregarHistorial = async (req, res) => {
    const rol = req.usuario.rol;
    const camposPermitidos = CAMPOS_CREACION_POR_ROL[rol] || [];

    const id_motos = camposPermitidos.includes('id_motos') ? req.body.id_motos : undefined;
    const descripcion_prodlema = camposPermitidos.includes('descripcion_prodlema') ? req.body.descripcion_prodlema : undefined;

    if (!id_motos || !descripcion_prodlema) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const yaActivo = await historial_mo.tieneHistorialActivo(id_motos);
        if (yaActivo) {
            return res.status(409).json({ message: 'Esta motocicleta ya tiene un historial activo. Debe finalizarse antes de registrar uno nuevo.' });
        }

        const fotoNombre = (camposPermitidos.includes('fotos') && req.file) ? req.file.filename : null;

        let repuestosParsed = [];
        if (camposPermitidos.includes('repuestos') && req.body.repuestos) {
            repuestosParsed = typeof req.body.repuestos === 'string' ? JSON.parse(req.body.repuestos) : req.body.repuestos;
        }

        const idTecnico = (camposPermitidos.includes('id_tecnico') && req.body.id_tecnico && req.body.id_tecnico !== 'null')
            ? req.body.id_tecnico
            : null;

        const descripcionTrabajo = (camposPermitidos.includes('descripcion_trabajo') && req.body.descripcion_trabajo && req.body.descripcion_trabajo !== 'null')
            ? req.body.descripcion_trabajo
            : null;

        const estadoInicial = (camposPermitidos.includes('estado') && req.body.estado) ? req.body.estado : 'En Asignacion';

        const dataInsert = {
            id_motos,
            id_tecnico: idTecnico,
            descripcion_prodlema,
            estado: estadoInicial,
            descripcion_trabajo: descripcionTrabajo,
            fotos: fotoNombre,
            fecha_inicio: new Date().toISOString().slice(0, 10),
            repuestos: repuestosParsed
        };

        const id = await historial_mo.create(dataInsert);
        res.status(201).json({ id_historial: id, ...dataInsert });
    } catch (error) {
        console.log("EL ERROR ES:", error);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.actualizarHistorial = async (req, res) => {
    const rol = req.usuario.rol;
    const camposPermitidos = CAMPOS_EDITABLES_POR_ROL[rol] || [];

    try {
        const existe = await historial_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Historial no encontrado' });

        if (existe.estado === 'Finalizado' && rol !== 1 && rol !== 17) {
            return res.status(409).json({ message: 'Este historial ya está finalizado y no se puede modificar.' });
        }

        if (rol === 3 && existe.id_tecnico) {
            return res.status(409).json({ message: 'Ya se asignó un técnico a este historial; no puedes editarlo.' });
        }

        const repuestosActuales = await historial_mo.getRepuestosByHistorial(req.params.id);

        const dataUpdate = {
            id_motos: existe.id_motos,
            id_tecnico: existe.id_tecnico,
            id_historial_cliente: existe.id_historial_cliente,
            descripcion_prodlema: existe.descripcion_prodlema,
            estado: existe.estado,
            descripcion_trabajo: existe.descripcion_trabajo,
            fotos: existe.fotos,
            fecha_inicio: existe.fecha_inicio,
            fecha_fin: existe.fecha_fin,
            repuestos: repuestosActuales,
        };

        const camposSimples = ['id_motos', 'id_tecnico', 'descripcion_prodlema', 'estado', 'descripcion_trabajo', 'fecha_inicio', 'fecha_fin'];
        for (const campo of camposSimples) {
            if (camposPermitidos.includes(campo) && req.body[campo] !== undefined) {
                dataUpdate[campo] = (req.body[campo] === 'null' || req.body[campo] === '') ? null : req.body[campo];
            }
        }

        const seAsignaTecnicoNuevo = camposPermitidos.includes('id_tecnico')
            && req.body.id_tecnico !== undefined
            && dataUpdate.id_tecnico
            && String(dataUpdate.id_tecnico) !== String(existe.id_tecnico || '');

        if (seAsignaTecnicoNuevo && existe.estado !== 'Finalizado') {
            dataUpdate.estado = 'En Proceso';
        }

        if (camposPermitidos.includes('fotos') && req.file) {
            dataUpdate.fotos = req.file.filename;
        }

        if (camposPermitidos.includes('repuestos') && req.body.repuestos) {
            dataUpdate.repuestos = typeof req.body.repuestos === 'string' ? JSON.parse(req.body.repuestos) : req.body.repuestos;
        }

        if (!dataUpdate.id_motos || !dataUpdate.descripcion_prodlema || !dataUpdate.fecha_inicio) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes' });
        }

        await historial_mo.update(req.params.id, dataUpdate);
        res.status(200).json({ message: 'Historial actualizado correctamente' });
    } catch (error) {
        console.log("EL ERROR ES:", error);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};

exports.eliminarHistorial = async (req, res) => {
    try {
        const existe = await historial_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Historial no encontrado' });

        if (req.usuario.rol === 3 && existe.id_tecnico) {
            return res.status(409).json({ message: 'Ya se asignó un técnico a este historial; no puedes eliminarlo.' });
        }

        await historial_mo.delete(req.params.id);
        res.status(200).json({ message: 'Historial eliminado correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        manejarError(error, res);
    }
};