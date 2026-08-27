// RF-M2.1 — Registrar repuesto
// Casos de prueba asociados: CP-046, CP-047, CP-048
//
// Los 3 CP ya estaban cubiertos; no falta ninguno.

jest.mock('../model/repuestoModelo');
jest.mock('../utils/manejarError');

const { crearRepuesto } = require('../controller/repuestosController');
const repuesto_mo = require('../model/repuestoModelo');
const manejarError = require('../utils/manejarError');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M2.1 — Registrar repuesto', () => {
    test('CP-046 — Debería crear el repuesto y responder 201', async () => {
        repuesto_mo.create.mockResolvedValue(10);

        const req = { body: { nombre_repuesto: 'Filtro de aceite', cantidad: 20 } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id_repuestos: 10 }));
    });

    test('CP-047 — Debería retornar 409 si el nombre del repuesto ya existe', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        repuesto_mo.create.mockRejectedValue(error);

        const req = { body: { nombre_repuesto: 'Filtro de aceite', cantidad: 20 } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Ya existe') })
        );
    });

    test('CP-048 — Debería retornar 400 si la cantidad es negativa', async () => {
        const req = { body: { nombre_repuesto: 'Filtro', cantidad: -5 } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(repuesto_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('mayor o igual a 0') })
        );
    });

    test('Debería retornar 400 si falta el nombre o la cantidad', async () => {
        const req = { body: { nombre_repuesto: 'Filtro' } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(repuesto_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería permitir cantidad = 0 (0 es válido, distinto de "no enviado")', async () => {
        repuesto_mo.create.mockResolvedValue(1);

        const req = { body: { nombre_repuesto: 'Filtro', cantidad: 0 } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(repuesto_mo.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        repuesto_mo.create.mockRejectedValue(error);

        const req = { body: { nombre_repuesto: 'Filtro', cantidad: 5 } };
        const res = crearRes();

        await crearRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});