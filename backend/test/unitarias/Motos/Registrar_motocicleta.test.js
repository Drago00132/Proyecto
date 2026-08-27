// RF-M4.1 — Registrar motocicleta
// Casos de prueba asociados: CP-096, CP-097, CP-098
// Los 3 ya estaban cubiertos; no falta ninguno.

jest.mock('../model/motosModelo');
jest.mock('../utils/manejarError');

const { crearMoto } = require('../controller/motosController');
const motos_mo = require('../model/motosModelo');
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

describe('RF-M4.1 — Registrar motocicleta', () => {
    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { body: { numero_identidad: '555', marca_moto: 'Yamaha', modelo_moto: 'FZ', placa: '' } };
        const res = crearRes();

        await crearMoto(req, res);

        expect(motos_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-096 — Debería registrar la moto y responder 201', async () => {
        motos_mo.create.mockResolvedValue(10);

        const req = { body: { numero_identidad: '555', marca_moto: 'Yamaha', modelo_moto: 'FZ', placa: 'ABC123' } };
        const res = crearRes();

        await crearMoto(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id_moto: 10 }));
    });

    test('CP-098 — Recepcionista SÍ puede registrar una moto para cualquier cliente (elige el numero_identidad)', async () => {
        motos_mo.create.mockResolvedValue(11);

        const req = { usuario: { rol: 16 }, body: { numero_identidad: '777', marca_moto: 'Honda', modelo_moto: 'CB1', placa: 'XYZ999' } };
        const res = crearRes();

        await crearMoto(req, res);

        expect(motos_mo.create).toHaveBeenCalledWith(expect.objectContaining({ numero_identidad: '777' }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-097 — Debería delegar a manejarError si la placa ya existe (ER_DUP_ENTRY)', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        motos_mo.create.mockRejectedValue(error);

        const req = { body: { numero_identidad: '555', marca_moto: 'Yamaha', modelo_moto: 'FZ', placa: 'ABC123' } };
        const res = crearRes();

        await crearMoto(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });
});