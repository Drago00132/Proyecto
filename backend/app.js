const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuariosRoutes');
const RolesRutas = require('./routes/rolRutas');
const MotosRutas = require('./routes/motosRutas');
const repuestoRutas = require('./routes/repuestosRutas');
const tecnicoRutas = require('./routes/tecnicoRutas');
const historialRutas = require('./routes/historialRepustos');
const login = require ('./routes/logion');
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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
});

module.exports = app;