// RF-M4.4 — Eliminar motocicleta
// Casos de prueba asociados: CP-105, CP-106
//
// Nota de actualización: motosController.eliminarMotos SÍ valida esto ahora (llama a
// historial_mo.tieneHistorialActivo antes de eliminar, mismo patrón que usa
// HistorialController en sentido inverso). El test de CP-106 estaba con .skip describiendo
// esto como "pendiente de implementar" — ya no lo está, así que se habilita.

jest.mock('../../../model/motosModelo');
jest.mock('../../../model/historialModelo');

const { eliminarMotos } = require('../../../controller/motosController');
const motos_mo = require('../../../model/motosModelo');
const historial_mo = require('../../../model/historialModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M4.4 — Eliminar motocicleta', () => {
    test('Debería retornar 404 si la moto no existe', async () => {
        motos_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarMotos(req, res);

        expect(motos_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-105 — Debería eliminar correctamente y responder 200', async () => {
        motos_mo.findById.mockResolvedValue({ id_motos: 1 });
        historial_mo.tieneHistorialActivo.mockResolvedValue(false);
        motos_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarMotos(req, res);

        expect(motos_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-106 — NO debería poder eliminar una moto con historial activo', async () => {
        motos_mo.findById.mockResolvedValue({ id_motos: 1 });
        historial_mo.tieneHistorialActivo.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarMotos(req, res);

        expect(motos_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});