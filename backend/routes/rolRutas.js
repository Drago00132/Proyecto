const express = require('express');
const router = express.Router();
const rol = require('../controller/RolController');
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(17), rol.ListarRol);
router.get('/consultar/:id', verificarToken, verificarRol(17), rol.obtenerRol);
router.post('/agregar', verificarToken, verificarRol(17), rol.crearRol);
router.put('/actualizar/:id', verificarToken, verificarRol(17), rol.actualizarRol);
router.delete('/eliminar/:id', verificarToken, verificarRol(17), rol.eliminarRol);

module.exports = router;