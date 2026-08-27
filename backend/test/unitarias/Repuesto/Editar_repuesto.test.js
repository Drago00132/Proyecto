// RF-M2.3 — Editar repuesto
// Casos de prueba asociados: CP-053, CP-054
//
// FALTA (parte de la Descripción/Postcondiciones del propio requisito, no un CP numerado):
//   - "Dejar trazabilidad del cambio" (registrar qué usuario editó y cuándo): el backend
//     actual (repuestosController.actualizarRepuesto) NO guarda esta información en
//     absoluto — no hay columna ni tabla para eso. La EDICIÓN en sí (nombre, cantidad,
//     validación de duplicados) sí funciona y está probada abajo; lo que falta es
//     específicamente el "quién y cuándo". Por eso este RF se clasifica como "Parcial" en
//     el Dashboard, no como "Pendiente real": la funcionalidad principal existe, le falta
//     un detalle puntual.

jest.mock('../model/repuestoModelo');

const { actualizarRepuesto } = require('../controller/repuestosController');
const repuesto_mo = require('../model/repuestoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M2.3 — Editar repuesto', () => {
    test('CP-053 — Debería actualizar correctamente y responder 200', async () => {
        repuesto_mo.findById.mockResolvedValue({ id_repuestos: 1 });
        repuesto_mo.update.mockResolvedValue(true);

        const req = { params: { id: '1' }, body: { nombre_repuesto: 'Filtro nuevo', cantidad: 15 } };
        const res = crearRes();

        await actualizarRepuesto(req, res);

        expect(repuesto_mo.update).toHaveBeenCalledWith('1', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-054 — Debería retornar 409 si el nuevo nombre ya lo tiene otro repuesto', async () => {
        repuesto_mo.findById.mockResolvedValue({ id_repuestos: 1 });
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        repuesto_mo.update.mockRejectedValue(error);

        const req = { params: { id: '1' }, body: { nombre_repuesto: 'Filtro repetido', cantidad: 15 } };
        const res = crearRes();

        await actualizarRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('Debería retornar 404 si el repuesto a editar no existe', async () => {
        repuesto_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: { nombre_repuesto: 'Filtro', cantidad: 5 } };
        const res = crearRes();

        await actualizarRepuesto(req, res);

        expect(repuesto_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 400 si falta el nombre, la cantidad, o la cantidad es negativa', async () => {
        const req = { params: { id: '1' }, body: { nombre_repuesto: 'Filtro', cantidad: -1 } };
        const res = crearRes();

        await actualizarRepuesto(req, res);

        expect(repuesto_mo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });
});