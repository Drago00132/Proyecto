const repuesto = require('../controller/repuestosController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/auditoria', verificarToken, verificarRol(1,17), repuesto.listarAuditoria);
router.get('/listar', verificarToken, verificarRol(1,2,16,17), repuesto.listarRepuest);
router.get('/buscar', verificarToken, verificarRol(1,2,16,17), repuesto.buscarPorNombre);
// RN (CP-052): el Técnico solo tiene acceso al listado general de repuestos,
// que es lo que necesita para registrar los que usó en un servicio. El
// detalle individual queda reservado a quien administra el inventario.
router.get('/consultar/:id', verificarToken, verificarRol(1,16,17), repuesto.obtenerRepuestos);
router.post('/agregar', verificarToken, verificarRol(1,16,17), repuesto.crearRepuesto);
router.put('/actualizar/:id', verificarToken, verificarRol(1,16,17), repuesto.actualizarRepuesto);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,16,17), repuesto.eliminarRepuesto);

module.exports = router;