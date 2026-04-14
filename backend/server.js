const swaggerUi = require ("swagger-ui-express");
const swaggerDocumentation = require ("./swagger.json");

const app = require("./app");
const Port = 3100;
app.listen(Port, () => {
    console.log(`Servidor corriendo en: http://localhost:${Port}`);
});

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocumentation));