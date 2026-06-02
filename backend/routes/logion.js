const auth_controler = require('../controller/auhtController');
const express = require('express');
const router = express.Router();

router.post('/login', auth_controler.login);

module.exports = router;