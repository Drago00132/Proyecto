const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./Routes/usuariosRoutes');
const RolesRutas = require('./Routes/RolRutas');
const MotosRutas = require('./Routes/motosRutas');
const repuestoRutas = require('./Routes/repuestosRutas');
const tecnicoRutas = require('./Routes/tecnicoRutas');
const historialRutas = require('./Routes/historialRepustos');
const login = require ('./Routes/logion');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/login',login);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', RolesRutas);
app.use('/api/motos', MotosRutas);
app.use('/api/repuestos', repuestoRutas);
app.use('/api/tecnico', tecnicoRutas);
app.use('/api/Historial', historialRutas);

module.exports = app;