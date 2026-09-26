// RF-M6.1 — Registrar entrada de repuestos
// Casos de prueba: CP-077 (M6), CP-078 (M6)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M6)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/entradaRepuestoModelo');

const { crearEntrada } = require('../../../controller/entradaRepuestosController');
const entrada_mo = require('../../../model/entradaRepuestoModelo');

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

    test('CP-078 (M6) — Debería retornar 400 si la cantidad ingresada es negativa', async () => {
        const req = { body: { ...datosBase, cantidad_ingresada: -3 } };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-078 (M6) — Debería retornar 400 si la cantidad ingresada no es un número', async () => {
        const req = { body: { ...datosBase, cantidad_ingresada: 'diez' } };
        const res = crearRes();

        await crearEntrada(req, res);

        expect(entrada_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-077 (M6) — Debería crear la entrada y responder 201 (el trigger de la BD suma el stock aparte, no se prueba aquí)', async () => {
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