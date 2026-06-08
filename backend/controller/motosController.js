const motos_mo = require('../model/motosModelo');

exports.listarMotos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const esAdmin = req.usuario.rol === 1;
        const filtroIdentidad = esAdmin ? null : req.usuario.id;

        const motos = await motos_mo.findAll(filtroIdentidad);

        const totalItems = motos.length;
        const totalPages = Math.ceil(totalItems / limit);
        const motosPaginados = motos.slice(offset, offset + limit);

        res.status(200).json({
            motos: motosPaginados,
            totalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerMotos = async (req, res) => {
    try {
        const motos = await motos_mo.findById(req.params.id);
        if (!motos) return res.status(404).json({ message: 'Moto no encontrada' });
        res.status(200).json(motos);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.crearMoto = async (req, res) => {
    const { numero_identidad, marca_moto, modelo_moto, placa } = req.body;

    if (!numero_identidad || !marca_moto || !modelo_moto || !placa) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const id = await motos_mo.create(req.body);
        res.status(201).json({ id_moto: id, ...req.body });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarMoto = async (req, res) => {
    const { numero_identidad, marca_moto, modelo_moto, placa } = req.body;

    if (!numero_identidad || !marca_moto || !modelo_moto || !placa) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const existe = await motos_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Moto no encontrada' });

        await motos_mo.update(req.params.id, req.body);
        res.status(200).json({ message: 'Moto actualizada correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};

exports.eliminarMotos = async (req, res) => {
    try {
        const existe = await motos_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Moto no encontrada' });

        await motos_mo.delete(req.params.id);
        res.status(200).json({ message: 'Moto eliminada correctamente' });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ message: 'Servicio de base de datos no disponible' });
        res.status(500).json({ error: error.message });
    }
};