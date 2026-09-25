const express = require('express');
const router = express.Router();
const Motos = require('../controller/motosController');
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');

router.get('/listar', verificarToken, verificarRol(1,2,3,16,17), Motos.listarMotos);
// RN (CP-102): el Técnico solo tiene acceso al listado general de motos, que
// es lo que necesita para ubicar el servicio que atiende. El detalle
// individual queda reservado al dueño de la moto y a quien la administra.
router.get('/consultar/:id', verificarToken, verificarRol(1,3,16,17), Motos.obtenerMotos);
router.post('/agregar', verificarToken, verificarRol(1,3,16,17), Motos.crearMoto);
router.put('/actualizar/:id', verificarToken, verificarRol(1,3,16,17), Motos.actualizarMoto);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,3,16,17), Motos.eliminarMotos);

module.exports = router;