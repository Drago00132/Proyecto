// RF-M8.3 — Eliminar técnico
// Casos de prueba: CP-092 (M8), CP-093 (M8)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M8)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/tecnicoModelo');

const { eliminarTecnico } = require('../../../controller/tecnicoController');
const tecnico_mo = require('../../../model/tecnicoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M8.3 — Eliminar técnico', () => {
    test('Debería retornar 404 si la ficha de técnico no existe', async () => {
        tecnico_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarTecnico(req, res);

        expect(tecnico_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-092 (M8) — Debería eliminar correctamente y responder 200', async () => {
        tecnico_mo.findById.mockResolvedValue({ id_tecnico: 5 });
        tecnico_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '5' } };
        const res = crearRes();

        await eliminarTecnico(req, res);

        expect(tecnico_mo.delete).toHaveBeenCalledWith('5');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test.skip('CP-093 (M8) — NO debería poder eliminar la ficha de un técnico con historial activo asignado (pendiente de implementar)', async () => {
        tecnico_mo.findById.mockResolvedValue({ id_tecnico: 5, tiene_historial_activo: true });

        const req = { params: { id: '5' } };
        const res = crearRes();

        await eliminarTecnico(req, res);

        expect(tecnico_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});