// RF-M4.3 — Actualizar motocicleta
// Casos de prueba asociados: CP-103, CP-104
// Los 2 ya estaban cubiertos; no falta ninguno.

jest.mock('../model/motosModelo');
jest.mock('../utils/manejarError');

const { actualizarMoto } = require('../controller/motosController');
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

const datosBase = { numero_identidad: '555', marca_moto: 'Yamaha', modelo_moto: 'FZ', placa: 'ABC123' };

describe('RF-M4.3 — Actualizar motocicleta', () => {
    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { params: { id: '1' }, body: { ...datosBase, marca_moto: '' } };
        const res = crearRes();

        await actualizarMoto(req, res);

        expect(motos_mo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si la moto a actualizar no existe', async () => {
        motos_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: datosBase };
        const res = crearRes();

        await actualizarMoto(req, res);

        expect(motos_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-103 — Debería actualizar correctamente y responder 200', async () => {
        motos_mo.findById.mockResolvedValue({ id_motos: 1 });
        motos_mo.update.mockResolvedValue(true);

        const req = { params: { id: '1' }, body: datosBase };
        const res = crearRes();

        await actualizarMoto(req, res);

        expect(motos_mo.update).toHaveBeenCalledWith('1', datosBase);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-104 — Debería delegar a manejarError si la nueva placa ya la tiene otra moto (ER_DUP_ENTRY)', async () => {
        motos_mo.findById.mockResolvedValue({ id_motos: 1 });
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        motos_mo.update.mockRejectedValue(error);

        const req = { params: { id: '1' }, body: { ...datosBase, placa: 'YAEXISTE1' } };
        const res = crearRes();

        await actualizarMoto(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });
});