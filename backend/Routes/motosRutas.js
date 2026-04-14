const express = require('express');
const router = express.Router();
const Motos = require('../Controller/motosController');

router.get('/listar',Motos.listarMotos);
router.get('/consultar/:id',Motos.obtenerMotos);
router.post('/agregar',Motos.crearMoto);
router.put('/actualizar/:id',Motos.actualizarMoto);
router.delete('/eliminar/:id',Motos.eliminarMotos);

module.exports = router;