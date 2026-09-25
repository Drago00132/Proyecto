const motos_mo = require('../model/motosModelo');
const historial_mo = require('../model/historialModelo');
const manejarError = require('../utils/manejarError');

exports.listarMotos = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // RN: el Cliente solo ve las motos asociadas a su propia identidad;
        // los demás roles ven el listado completo.
        const filtroIdentidad = Number(req.usuario?.rol) === 3 ? req.usuario.id : null;

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
        manejarError(error, res);
    }
};

exports.obtenerMotos = async (req, res) => {
    try {
        const motos = await motos_mo.findById(req.params.id);
        if (!motos) return res.status(404).json({ message: 'Moto no encontrada' });
        res.status(200).json(motos);
    } catch (error) {
        manejarError(error, res);
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
        manejarError(error, res);
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
        manejarError(error, res);
    }
};

exports.eliminarMotos = async (req, res) => {
    try {
        const existe = await motos_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Moto no encontrada' });

        // RN: una moto con un servicio en curso no se puede eliminar.
        const activo = await historial_mo.tieneHistorialActivo(req.params.id);
        if (activo) {
            return res.status(409).json({ message: 'No se puede eliminar: la moto tiene un servicio activo.' });
        }

        await motos_mo.delete(req.params.id);
        res.status(200).json({ message: 'Moto eliminada correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};