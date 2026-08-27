// RF-M6.3 — Editar entrada de repuestos
// Casos de prueba asociados: CP-081 Edición exitosa.
// AVISO: mismo número que CP-081 de RF-M3.4. Misma duplicidad de numeración ya señalada.
//
// FALTA — y no se puede resolver con una prueba unitaria: el ajuste de stock por la
// DIFERENCIA entre la cantidad nueva y la anterior lo hace el trigger
// "actualizar_stock_entrada" (AFTER UPDATE), no el controlador. Igual que en RF-M6.1, se
// necesitaría una prueba de integración contra una base de datos real para verificarlo.

jest.mock('../model/entradaRepuestoModelo');

const { actualizarEntrada } = require('../controller/entradaRepuestosController');
const entrada_mo = require('../model/entradaRepuestoModelo');

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

describe('RF-M6.3 — Editar entrada de repuestos', () => {
    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { params: { id: '1' }, body: { ...datosBase, fecha_entrada: '' } };
        const res = crearRes();

        await actualizarEntrada(req, res);

        expect(entrada_mo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si la entrada a editar no existe', async () => {
        entrada_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: datosBase };
        const res = crearRes();

        await actualizarEntrada(req, res);

        expect(entrada_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-081 (RF-M6) — Debería actualizar correctamente y responder 200 (el ajuste de stock lo hace el trigger, no se prueba aquí)', async () => {
        entrada_mo.findById.mockResolvedValue({ id_entrada: 1 });
        entrada_mo.update.mockResolvedValue(true);

        const req = { params: { id: '1' }, body: { ...datosBase, cantidad_ingresada: 30 } };
        const res = crearRes();

        await actualizarEntrada(req, res);

        expect(entrada_mo.update).toHaveBeenCalledWith('1', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});