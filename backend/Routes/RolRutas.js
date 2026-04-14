const express = require('express');
const router = express.Router();
const rol = require('../Controller/RolController');

router.get('/listar',rol.ListarRol);
router.get('/consultar/:id',rol.obtenerRol);
router.post('/agregar',rol.crearRol);
router.put('/actualizar/:id',rol.actualizarRol);
router.delete('/eliminar/:id',rol.eliminarRol);

module.exports= router;