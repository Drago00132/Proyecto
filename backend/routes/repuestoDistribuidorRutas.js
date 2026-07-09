const rd = require('../controller/repuestoDistribuidorController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1), rd.listarRelaciones);
router.get('/consultar/:id_distribuidor', verificarToken, verificarRol(1), rd.listarPorDistribuidor);
router.get('/porRepuesto/:id_repuestos', verificarToken, verificarRol(1), rd.obtenerPorRepuesto);
router.post('/asignar', verificarToken, verificarRol(1), rd.asignarDistribuidor);
router.post('/agregar', verificarToken, verificarRol(1), rd.crearRelacion);
router.delete('/eliminar/:id', verificarToken, verificarRol(1), rd.eliminarRelacion);

module.exports = router;