const auth_controler = require('../controller/auhtController');
const express = require('express');
const router = express.Router();

router.post('/login', auth_controler.login);
router.post('/verificar-2fa', auth_controler.verificarCodigo2FA);
router.post('/solicitar-recuperacion', auth_controler.solicitarRecuperacion);
router.post('/restablecer-contrasena', auth_controler.restablecerContrasena);

module.exports = router;