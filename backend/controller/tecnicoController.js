const tecnico_mo = require('../model/tecnicoModelo');
const usuario_mo = require('../model/usuariosModelo');
const manejarError = require('../utils/manejarError');

exports.ListarTecnico = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 1;
        const limit = Number.parseInt(req.query.limit) || 10;
        const offset = (page - 1 ) * limit;
        let tecnico = await tecnico_mo.findAll();

        // RF-37: el técnico solo debe ver su propia ficha, no el listado completo.
        // Administrador y Super Administrador siguen viendo todas.
        if (req.usuario.rol === 2) {
            tecnico = tecnico.filter((t) => Number(t.numero_identidad) === Number(req.usuario.id));
        }

        const totgalItems = tecnico.length;
        const totalPages = Math.ceil(totgalItems / limit);
        const tecnicosPaginados = tecnico.slice(offset, offset + limit);
        res.status(200).json({
            tecnico: tecnicosPaginados,
            totgalItems,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.obtenerTecnico = async (req, res) => {
    try {
        const tecnico = await tecnico_mo.findById(req.params.id);
        if (!tecnico) return res.status(404).json({ message: 'Técnico no encontrado' });
        res.status(200).json(tecnico);
    } catch (error) {
        manejarError(error, res);
    }
};

exports.agregarTecnico = async (req, res) => {
    const { numero_identidad, reparaciones_asignadas } = req.body;

    if (!numero_identidad || reparaciones_asignadas === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const reparacionesNum = Number(reparaciones_asignadas);
    if (Number.isNaN(reparacionesNum)) {
        return res.status(400).json({ message: 'Reparaciones asignadas debe ser un número' });
    }

    try {
        // RN-025: solo un usuario con rol Técnico puede tener una ficha de técnico
        // asociada. Antes se podía crear una ficha para cualquier numero_identidad,
        // incluso sin cuenta de usuario o con otro rol, quedando huérfana.
        const usuario = await usuario_mo.findById(numero_identidad);
        if (!usuario) {
            return res.status(404).json({ message: 'No existe ningún usuario con ese número de identidad' });
        }
        if (Number(usuario.id_rol) !== 2) {
            return res.status(409).json({ message: 'Ese usuario no tiene rol Técnico; no se le puede crear una ficha de técnico' });
        }

        const id = await tecnico_mo.create({ ...req.body, reparaciones_asignadas: reparacionesNum });
        res.status(201).json({ id_tecnico: id, ...req.body });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.actializarTecnico = async (req, res) => {
    const { numero_identidad, reparaciones_asignadas } = req.body;

    if (!numero_identidad || reparaciones_asignadas === undefined) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // RF-38: Reparaciones asignadas debe ser numérico.
    const reparacionesNum = Number(reparaciones_asignadas);
    if (Number.isNaN(reparacionesNum)) {
        return res.status(400).json({ message: 'Reparaciones asignadas debe ser un número' });
    }

    try {
        const existe = await tecnico_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Técnico no encontrado' });

        await tecnico_mo.update(req.params.id, { ...req.body, reparaciones_asignadas: reparacionesNum });
        res.status(200).json({ message: 'Técnico actualizado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};

exports.eliminarTecnico = async (req, res) => {
    try {
        const existe = await tecnico_mo.findById(req.params.id);
        if (!existe) return res.status(404).json({ message: 'Técnico no encontrado' });

        await tecnico_mo.delete(req.params.id);
        res.status(200).json({ message: 'Técnico eliminado correctamente' });
    } catch (error) {
        manejarError(error, res);
    }
};