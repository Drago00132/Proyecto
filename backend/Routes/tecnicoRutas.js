const tecnico = require('../Controller/tecnicoController');
const express= require('express');
const router =express.Router();

router.get('/listar',tecnico.ListarTecnico);
router.get('/consultar/:id',tecnico.obtenerTecnico);
router.post('/agregar',tecnico.agregarTecnico);
router.put('/actualizar/:id',tecnico.actializarTecnico);
router.delete('/eliminar/:id',tecnico.eliminarTecnico);

module.exports = router;