const express = require('express');
const router = express.Router();
const Motos = require('../controller/motosController');
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1, 3), Motos.listarMotos);
router.get('/consultar/:id', verificarToken, verificarRol(1, 3), Motos.obtenerMotos);
router.post('/agregar', verificarToken, verificarRol(1, 3), Motos.crearMoto);
router.put('/actualizar/:id', verificarToken, verificarRol(1,3), Motos.actualizarMoto);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,3), Motos.eliminarMotos);

module.exports = router;