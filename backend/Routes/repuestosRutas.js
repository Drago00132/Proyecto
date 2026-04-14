const repuesto= require('../Controller/repuestosController');
const express= require('express');
const router = express.Router();

router.get('/listar',repuesto.listarRepuest);
router.get('/consultar/:id',repuesto.obtenerRepuestos);
router.post('/agregar',repuesto.crearRepuesto);
router.put('/actualizar/:id',repuesto.actualizarRepuesto);
router.delete('/eliminar/:id',repuesto.eliminarRepuesto);

module.exports = router;