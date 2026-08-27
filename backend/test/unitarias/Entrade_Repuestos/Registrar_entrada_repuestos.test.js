// RF-M6.1 — Registrar entrada de repuestos
// Casos de prueba asociados: CP-077, CP-078, CP-079b
//
// AVISO: CP-077 y CP-078 son los mismos números que ya se usaron en RF-M3.3 (intento de
// modificar registro finalizado, y cliente intenta modificar). Misma duplicidad de
// numeración que ya señalamos en RF-M5.
//
// FALTA — y no se puede resolver con una prueba unitaria:
//   - CP-079b Verificación de aumento automático de stock: esto lo hace el trigger de la
//     base de datos "sumar_stock_entrada", no el controlador ni el modelo en JavaScript.
//     No hay nada que mockear aquí porque no hay ninguna línea de código de aplicación que
//     ejecute esa suma — ocurre directamente en MySQL cuando se inserta la fila. Para
//     probar esto de verdad haría falta una prueba de integración contra una base de datos
//     real (crear una entrada y luego consultar el stock del repuesto para confirmar que
//     subió), no una prueba unitaria con el modelo mockeado.

jest.mock('../model/entradaRepuestoModelo');

const { crearEntrada } = require('../controller/entradaRepuestosController');
const entrada_mo = require('../model/entradaRepuestoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

const datosBase = {
    fecha_entrada: '2026-08-11',
    cantidad_ingresada: 20,
    id_repuestos: '1',
    id_distribuidor: '1',
    numero_identidad: '555'
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M6.1 — Registrar entrada de repuestos', () => {
    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { body: { ...datosBase, id_distribuidor: '' } };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-078 (RF-M6) — Debería retornar 400 si la cantidad ingresada es negativa', async () => {
        const req = { body: { ...datosBase, cantidad_ingresada: -3 } };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-078 (RF-M6) — Debería retornar 400 si la cantidad ingresada no es un número', async () => {
        const req = { body: { ...datosBase, cantidad_ingresada: 'diez' } };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-077 (RF-M6) — Debería crear la entrada y responder 201 (el trigger de la BD suma el stock aparte, no se prueba aquí)', async () => {
        entrada_mo.create.mockResolvedValue(10);

        const req = { body: datosBase };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).toHaveBeenCalledWith(datosBase);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        entrada_mo.create.mockRejectedValue(error);

        const req = { body: datosBase };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});