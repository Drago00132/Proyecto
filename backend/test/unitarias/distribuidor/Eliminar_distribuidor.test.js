
jest.mock('../../../model/distribuidorModelo');

const { eliminarDistribuidor } = require('../../../controller/distribuidoresController');
const distribuidor_mo = require('../../../model/distribuidorModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M5.4 — Eliminar distribuidor', () => {
    test('Debería retornar 404 si el distribuidor no existe', async () => {
        distribuidor_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarDistribuidor(req, res);

        expect(distribuidor_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-074 (RF-M5) — Debería eliminar correctamente y responder 200', async () => {
        distribuidor_mo.findById.mockResolvedValue({ id_distribuidor: 1 });
        distribuidor_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarDistribuidor(req, res);

        expect(distribuidor_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});