const rd_mo = require('../model/repuestoDistribuidorModelo');
const manejarError = require('../utils/manejarError');

exports.listarRelaciones = async (req, res) => {
    try {
        const relaciones = await rd_mo.findAll();
        res.status(200).json({ relaciones });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.listarPorDistribuidor = async (req, res) => {
    try {
        const relaciones = await rd_mo.findByDistribuidor(req.params.id_distribuidor);
        res.status(200).json({ relaciones });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.obtenerPorRepuesto = async (req, res) => {
    try {
        const relacion = await rd_mo.findByRepuesto(req.params.id_repuestos);
        res.status(200).json(relacion);
    } catch (error) {
        manejarError(error, res);
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
        manejarError(error, res);
    }
};

exports.crearRelacion = async (req, res) => {
    const { id_repuestos, id_distribuidor } = req.body;

    if (!id_repuestos || !id_distribuidor) {
        return res.status(400).json({ message: 'id_repuestos e id_distribuidor son obligatorios' });
    }

    try {
        // RF-28: unificado con asignarDistribuidor. Antes esta vía usaba rd_mo.create(),
        // que no liberaba una asignación previa del repuesto y permitía que quedara
        // vinculado a más de un distribuidor a la vez. Ahora usa siempre la misma
        // lógica de "asignar" (única vía oficial), que garantiza que un repuesto
        // tenga un único distribuidor en todo momento.
        const id = await rd_mo.asignar(id_repuestos, id_distribuidor);
        res.status(201).json({ id_repuesto_distribuidor: id, id_repuestos, id_distribuidor });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ese repuesto ya está vinculado a ese distribuidor' });
        manejarError(error, res);
    }
};

exports.eliminarRelacion = async (req, res) => {
    try {
        await rd_mo.delete(req.params.id);
        res.status(200).json({ message: 'Relación eliminada correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};