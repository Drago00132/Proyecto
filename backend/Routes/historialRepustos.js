const historail = require('../Controller/HistorialController');
const express = require('express');
const router= express.Router();

router.get('/listar',historail.listarHistrial);
router.get('/consultar/:id',historail.obtenerHistorial);
router.post('/agregar',historail.agregarHistorial);
router.put('/actualizar/:id',historail.actualizarHistorial);
router.delete('/eliminar/:id',historail.eliminarHistorial);

module.exports = router;