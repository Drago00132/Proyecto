const entrada = require('../controller/entradaRepuestosController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1,17), entrada.listarEntradas);
router.get('/consultar/:id', verificarToken, verificarRol(1,17), entrada.obtenerEntrada);
router.post('/agregar', verificarToken, verificarRol(1,17), entrada.crearEntrada);
router.put('/actualizar/:id', verificarToken, verificarRol(1,17), entrada.actualizarEntrada);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,17), entrada.eliminarEntrada);

module.exports = router;