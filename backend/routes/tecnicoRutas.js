const tecnico = require('../controller/tecnicoController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1,2), tecnico.ListarTecnico);
router.get('/consultar/:id', verificarToken, verificarRol(1), tecnico.obtenerTecnico);
router.post('/agregar', verificarToken, verificarRol(1), tecnico.agregarTecnico);
router.put('/actualizar/:id', verificarToken, verificarRol(1), tecnico.actializarTecnico);
router.delete('/eliminar/:id', verificarToken, verificarRol(1), tecnico.eliminarTecnico);

module.exports = router;