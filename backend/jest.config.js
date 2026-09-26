// Configuración de Jest para el backend de SIGAT.
//
//  maxWorkers: 1  es lo importante de este archivo.
//
//  Por defecto Jest reparte los archivos de prueba entre varios procesos que
//  corren AL MISMO TIEMPO. Para las pruebas unitarias eso no molesta, porque
//  cada una trabaja con la base simulada. Pero las pruebas integradas usan
//  una base de datos de verdad, y esa base es una sola: si dos archivos
//  corren a la vez, uno crea un servicio en la moto de prueba mientras el
//  otro está limpiándola, o los dos intentan registrar un usuario con el
//  mismo teléfono. Los fallos que salen de ahí no son fallos del sistema,
//  son dos pruebas pisándose.
//
//  Con maxWorkers: 1 los archivos corren uno detrás de otro y cada uno
//  encuentra la base como la dejó el anterior. La suite completa tarda unos
//  segundos más, y a cambio el resultado es el mismo siempre, en cualquier
//  equipo, sin importar cuántos núcleos tenga.

module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  testMatch: ['**/test/**/*.test.js'],
};
