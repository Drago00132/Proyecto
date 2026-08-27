// RF-M5.3 — Editar distribuidor
// Casos de prueba asociados: CP-073 Edición exitosa.

jest.mock('../model/distribuidorModelo');

const { actualizarDistribuidor } = require('../controller/distribuidoresController');
const distribuidor_mo = require('../model/distribuidorModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M5.3 — Editar distribuidor', () => {
    test('Debería retornar 400 si el nombre viene vacío', async () => {
        const req = { params: { id: '1' }, body: { telefono: '3001234567' } };
        const res = crearRes();

        await actualizarDistribuidor(req, res);

        expect(distribuidor_mo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si el distribuidor a editar no existe', async () => {
        distribuidor_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: { nombre_distribuidor: 'Nuevo nombre' } };
        const res = crearRes();

        await actualizarDistribuidor(req, res);

        expect(distribuidor_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-073 (RF-M5) — Debería actualizar correctamente y responder 200', async () => {
        distribuidor_mo.findById.mockResolvedValue({ id_distribuidor: 1 });
        distribuidor_mo.update.mockResolvedValue(true);

        const req = { params: { id: '1' }, body: { nombre_distribuidor: 'Repuestos del Norte Actualizado' } };
        const res = crearRes();

        await actualizarDistribuidor(req, res);

        expect(distribuidor_mo.update).toHaveBeenCalledWith('1', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});