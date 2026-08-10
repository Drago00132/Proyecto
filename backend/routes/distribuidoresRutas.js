const distribuidor = require('../controller/distribuidoresController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1,17), distribuidor.listarDistribuidores);
router.get('/consultar/:id', verificarToken, verificarRol(1,17), distribuidor.obtenerDistribuidor);
router.post('/agregar', verificarToken, verificarRol(1,17), distribuidor.crearDistribuidor);
router.put('/actualizar/:id', verificarToken, verificarRol(1,17), distribuidor.actualizarDistribuidor);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,17), distribuidor.eliminarDistribuidor);

module.exports = router;