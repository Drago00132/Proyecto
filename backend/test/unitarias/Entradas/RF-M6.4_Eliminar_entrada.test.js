// RF-M6.4 — Eliminar entrada de repuestos
// Casos de prueba: CP-082 (M6)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M6)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/entradaRepuestoModelo');

const { eliminarEntrada } = require('../../../controller/entradaRepuestosController');
const entrada_mo = require('../../../model/entradaRepuestoModelo');

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

    test('CP-082 (M6) — Debería eliminar correctamente y responder 200 (la resta de stock la hace el trigger, no se prueba aquí)', async () => {
        entrada_mo.findById.mockResolvedValue({ id_entrada: 1 });
        entrada_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarEntrada(req, res);

        expect(entrada_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});