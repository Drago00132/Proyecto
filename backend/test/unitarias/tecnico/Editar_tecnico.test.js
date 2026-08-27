// RF-M8.2 — Editar técnico
// Casos de prueba asociados: CP-091 Edición exitosa.
// AVISO: mismo número que CP-091 de RF-M3.6. Misma duplicidad de numeración ya señalada.

jest.mock('../model/tecnicoModelo');

const { actializarTecnico } = require('../controller/tecnicoController'); // nombre real de la función (con el typo "actializar")
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

describe('RF-M8.2 — Editar técnico', () => {
    test('Debería retornar 400 si falta algún campo obligatorio', async () => {
        const req = { params: { id: '5' }, body: { numero_identidad: '123' } };
        const res = crearRes();

        await actializarTecnico(req, res);

        expect(tecnico_mo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si la ficha de técnico a editar no existe', async () => {
        tecnico_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: { numero_identidad: '123', reparaciones_asignadas: 4 } };
        const res = crearRes();

        await actializarTecnico(req, res);

        expect(tecnico_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-091 (RF-M8) — Debería actualizar la carga de reparaciones asignadas y responder 200', async () => {
        tecnico_mo.findById.mockResolvedValue({ id_tecnico: 5 });
        tecnico_mo.update.mockResolvedValue(true);

        const req = { params: { id: '5' }, body: { numero_identidad: '123', reparaciones_asignadas: 4 } };
        const res = crearRes();

        await actializarTecnico(req, res);

        expect(tecnico_mo.update).toHaveBeenCalledWith('5', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});