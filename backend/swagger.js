const swaggerAutogen = require  ("swagger-autogen")();

const outputFile = './swagger.json';
const endpointsFiles = ['./app.js']; 

const doc = {
    info: {
        title: 'API de sigat',
        description: 'Estas son las apis de sigat'
    },
    host: 'localhost:3100',
    schemes: ['http']
};

swaggerAutogen(outputFile, endpointsFiles, doc);