const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger.json';
const endpointsFiles = ['./app.js'];
const doc = {
    info: {
        title: 'API de sigat',
        description: 'Estas son las apis de sigat'
    },
    host: 'localhost:3100',
    schemes: ['http'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'authorization', 
            description: "Introduce el token JWT con el formato: Bearer <token>"
        }
    },
    security: [ { bearerAuth: [] } ] 
};

swaggerAutogen(outputFile, endpointsFiles, doc);