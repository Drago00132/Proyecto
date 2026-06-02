require('dotenv').config();

const swaggerUi = require("swagger-ui-express");
const swaggerDocumentation = require("./swagger.json");

const app = require("./app");
const Port = 3100;
app.listen(Port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en: http://localhost:${Port}`);
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocumentation));