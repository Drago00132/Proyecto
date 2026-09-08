require('dotenv').config();

const swaggerUi = require("swagger-ui-express");
const swaggerDocumentation = require("./swagger.json");

const app = require("./app");
// Render (y la mayoría de los hosts gratuitos) asignan el puerto real por
// variable de entorno PORT; 3100 solo se usa como valor por defecto para
// desarrollo local.
const Port = process.env.PORT || 3100;
app.listen(Port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en: http://localhost:${Port}`);
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocumentation));