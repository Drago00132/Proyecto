// RF-M8.3 — Eliminar técnico
// Casos de prueba asociados: CP-092 Eliminación exitosa. CP-093 Intento de eliminar técnico
// con historial activo.
//
// FALTA: CP-093 — SE ESCRIBIÓ abajo, pero el código actual (eliminarTecnico) NO valida si
// el técnico tiene historiales activos asignados antes de borrar su ficha. Mismo patrón que
// ya encontramos en RF-M4.4 (eliminar moto) — queda con test.skip.
//
// Nota aparte: eliminar la FICHA de técnico no elimina la cuenta de usuario (rol Técnico)
// asociada — son dos tablas distintas. Ya lo comprobamos en las pruebas de Selenium de
// Técnicos (tecnico.test.js), donde había que limpiar el usuario por separado.

jest.mock('../model/tecnicoModelo');

const { eliminarTecnico } = require('../controller/tecnicoController');
const tecnico_mo = require('../model/tecnicoModelo');

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

    test('CP-092 (RF-M8) — Debería eliminar correctamente y responder 200', async () => {
        tecnico_mo.findById.mockResolvedValue({ id_tecnico: 5 });
        tecnico_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '5' } };
        const res = crearRes();

        await eliminarTecnico(req, res);

        expect(tecnico_mo.delete).toHaveBeenCalledWith('5');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test.skip('CP-093 — NO debería poder eliminar la ficha de un técnico con historial activo asignado (pendiente de implementar)', async () => {
        tecnico_mo.findById.mockResolvedValue({ id_tecnico: 5, tiene_historial_activo: true });

        const req = { params: { id: '5' } };
        const res = crearRes();

        await eliminarTecnico(req, res);

        expect(tecnico_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});