const repuesto = require('../controller/repuestosController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1,2,16,17), repuesto.listarRepuest);
router.get('/consultar/:id', verificarToken, verificarRol(1,16,17), repuesto.obtenerRepuestos);
router.post('/agregar', verificarToken, verificarRol(1,16,17), repuesto.crearRepuesto);
router.put('/actualizar/:id', verificarToken, verificarRol(1,16,17), repuesto.actualizarRepuesto);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,16,17), repuesto.eliminarRepuesto);

module.exports = router;