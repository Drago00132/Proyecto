const auth_controler = require('../Controller/auhtController');
const express = require('express');
const router = express.Router();

router.post('/login', auth_controler.login);

module.exports = router;