const historial = require('../controller/HistorialController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1, 2), historial.listarHistrial);
router.get('/consultar/:id', verificarToken, verificarRol(1, 2, 3), historial.obtenerHistorial);
router.post('/agregar', verificarToken, verificarRol(1, 3), historial.agregarHistorial);
router.put('/actualizar/:id', verificarToken, verificarRol(1, 2), historial.actualizarHistorial);
router.delete('/eliminar/:id', verificarToken, verificarRol(1, 3), historial.eliminarHistorial);

module.exports = router;