const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuariosController');
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1), usuarioController.listarUsuarios);
router.get('/consultar/:id', verificarToken, verificarRol(1), usuarioController.obtenerUsuario);
router.post('/agregar', verificarToken, verificarRol(1), usuarioController.crearUsuario);
router.put('/actualizar/:id', verificarToken, verificarRol(1), usuarioController.actualizarUsuario);
router.delete('/eliminar/:id', verificarToken, verificarRol(1), usuarioController.eliminarUsuario);

module.exports = router;