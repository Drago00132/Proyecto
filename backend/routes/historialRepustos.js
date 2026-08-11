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

const EXTENSIONES_VALIDAS = ['.jpg', '.jpeg', '.png', '.webp'];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (EXTENSIONES_VALIDAS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes en formato JPG, JPEG, PNG o WEBP'));
    }
  }
});

function subirFoto(req, res, next) {
  upload.single('fotos')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'No se pudo procesar el archivo adjunto' });
    }
    next();
  });
}

router.get('/listar', verificarToken, verificarRol(1,2,3,16,17), historial.listarHistrial);
router.get('/consultar/:id', verificarToken, verificarRol(1,2,3,16,17), historial.obtenerHistorial);
router.post('/agregar', subirFoto, verificarToken, verificarRol(1,3,16,17), historial.agregarHistorial);
router.put('/actualizar/:id', subirFoto, verificarToken, verificarRol(1,2,3,16,17), historial.actualizarHistorial);
router.delete('/eliminar/:id', verificarToken, verificarRol(1,3,17), historial.eliminarHistorial);

module.exports = router;