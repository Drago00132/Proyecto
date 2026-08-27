// RF-M6.4 — Eliminar entrada de repuestos
// Casos de prueba asociados: CP-082 Eliminación exitosa.
// AVISO: mismo número que CP-082 de RF-M3.4. Misma duplicidad de numeración ya señalada.
//
// FALTA — y no se puede resolver con una prueba unitaria: la resta de stock la hace el
// trigger "restar_stock_entrada_eliminada" (AFTER DELETE), no el controlador. Se necesitaría
// una prueba de integración contra una base de datos real para verificarlo.

jest.mock('../model/entradaRepuestoModelo');

const { eliminarEntrada } = require('../controller/entradaRepuestosController');
const entrada_mo = require('../model/entradaRepuestoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M6.4 — Eliminar entrada de repuestos', () => {
    test('Debería retornar 404 si la entrada no existe', async () => {
        entrada_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarEntrada(req, res);

        expect(entrada_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-082 (RF-M6) — Debería eliminar correctamente y responder 200 (la resta de stock la hace el trigger, no se prueba aquí)', async () => {
        entrada_mo.findById.mockResolvedValue({ id_entrada: 1 });
        entrada_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarEntrada(req, res);

        expect(entrada_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});