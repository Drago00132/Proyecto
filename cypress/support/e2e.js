// Se carga automáticamente antes de cada archivo de pruebas.
import './commands';

// El frontend usa react-toastify y algunas peticiones fallan a propósito en
// las pruebas negativas; esos errores no deben tumbar la corrida.
Cypress.on('uncaught:exception', () => false);
