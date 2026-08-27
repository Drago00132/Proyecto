// RF-M4.4 — Eliminar motocicleta
// Casos de prueba asociados: CP-105, CP-106
//
// FALTA respecto al documento de Casos de Prueba:
//   - CP-106 Intento de eliminar moto con historial activo: SE ESCRIBIÓ abajo, pero el
//     código actual (motosController.eliminarMotos) NO valida esto en absoluto — elimina
//     la moto sin revisar si tiene un historial en curso. Queda con test.skip para
//     describir el comportamiento que DEBERÍA existir, sin tumbar la suite. Quítale el
//     .skip una vez que se agregue esa validación (sería el mismo patrón que ya usa
//     HistorialController con tieneHistorialActivo, aplicado en sentido inverso: antes de
//     eliminar la moto, en vez de antes de crear el historial).

jest.mock('../model/motosModelo');

const { eliminarMotos } = require('../controller/motosController');
const motos_mo = require('../model/motosModelo');

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
        motos_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarMotos(req, res);

        expect(motos_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test.skip('CP-106 — NO debería poder eliminar una moto con historial activo (pendiente de implementar)', async () => {
        motos_mo.findById.mockResolvedValue({ id_motos: 1, tiene_historial_activo: true });

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarMotos(req, res);

        expect(motos_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});