const express = require('express');
const cors = require('cors');
const path = require('path');
const usuariosRoutes = require('./routes/usuariosRoutes');
const RolesRutas = require('./routes/rolRutas');
const MotosRutas = require('./routes/motosRutas');
const repuestoRutas = require('./routes/repuestosRutas');
const tecnicoRutas = require('./routes/tecnicoRutas');
const historialRutas = require('./routes/historialRepustos');
const distribuidoresRutas = require('./routes/distribuidoresRutas');
const entradaRepuestosRutas = require('./routes/entradaRepuestosRutas');
const repuestoDistribuidorRutas = require('./routes/repuestoDistribuidorRutas');
const login = require ('./routes/logion');
const app = express();

app.disable('x-powered-by');

const allowedOrigins = ['http://localhost:3000']; 

app.use(cors({ origin: allowedOrigins })); 
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/login',login);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', RolesRutas);
app.use('/api/motos', MotosRutas);
app.use('/api/repuestos', repuestoRutas);
app.use('/api/tecnico', tecnicoRutas);
app.use('/api/Historial', historialRutas);
app.use('/api/distribuidores', distribuidoresRutas);
app.use('/api/entradaRepuestos', entradaRepuestosRutas);
app.use('/api/repuestoDistribuidor', repuestoDistribuidorRutas);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
});

module.exports = app;