// RF-M2.4 — Eliminar repuesto
// Casos de prueba: CP-055, CP-057

jest.mock('../../../model/repuestoModelo');
jest.mock('../../../config/db');

const { eliminarRepuesto } = require('../../../controller/repuestosController');
const repuesto_mo = require('../../../model/repuestoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M2.4 — Eliminar repuesto', () => {
    test('CP-055 — Debería eliminar correctamente y responder 200', async () => {
        repuesto_mo.findById.mockResolvedValue({ id_repuestos: 1 });
        repuesto_mo.delete.mockResolvedValue(true);

        const req = { usuario: { rol: 1, id: '1' }, params: { id: '1' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(repuesto_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-057 — Debería retornar 404 si el repuesto no existe', async () => {
        repuesto_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(repuesto_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        repuesto_mo.findById.mockRejectedValue(error);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});