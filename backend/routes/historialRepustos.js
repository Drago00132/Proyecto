const historial = require('../controller/HistorialController');
const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../Middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage })

router.get('/listar', verificarToken, verificarRol(1, 2, 3), historial.listarHistrial);
router.get('/consultar/:id', verificarToken, verificarRol(1, 2, 3), historial.obtenerHistorial);
router.post('/agregar', upload.single('fotos'), verificarToken, verificarRol(1, 3), historial.agregarHistorial);
router.put('/actualizar/:id', upload.single('fotos'), verificarToken, verificarRol(1, 2, 3), historial.actualizarHistorial);
router.delete('/eliminar/:id', verificarToken, verificarRol(1, 3), historial.eliminarHistorial);

module.exports = router;