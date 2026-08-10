const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuariosController');
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/registrar-publico', usuarioController.crearUsuario);
router.post('/cargar-masiva', verificarToken, verificarRol(1,17), upload.single('archivo'), usuarioController.cargaMasiva);
router.get('/roles-asignables', verificarToken, verificarRol(1,16,17), usuarioController.obtenerRolesAsignables);
router.get('/listar', verificarToken, verificarRol(1,2,3,16,17), usuarioController.listarUsuarios);
router.get('/consultar/:id', verificarToken, verificarRol(1,16,17), usuarioController.obtenerUsuario);
router.post('/agregar', verificarToken, verificarRol(1,16,17), usuarioController.crearUsuario);
router.put('/actualizar/:id', verificarToken, verificarRol(1,16,17), usuarioController.actualizarUsuario);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,17), usuarioController.eliminarUsuario);

module.exports = router;