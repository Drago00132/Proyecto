const express = require('express');
const router = express.Router();
const usuarioController = require('../Controller/usuariosController');

router.get('/listar', usuarioController.listarUsuarios);
router.get('/consultar/:id', usuarioController.obtenerUsuario);
router.post('/agregar', usuarioController.crearUsuario);
router.put('/actualizar/:id', usuarioController.actualizarUsuario);
router.delete('/eliminar/:id', usuarioController.eliminarUsuario);

module.exports = router;