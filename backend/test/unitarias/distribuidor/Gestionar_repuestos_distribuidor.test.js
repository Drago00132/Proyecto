// RF-M5.5 — Gestionar repuestos por distribuidor
// Casos de prueba asociados: CP-075 Asignación exitosa. CP-076 Reasignación de repuesto a
// otro distribuidor.
//
// Este es el RF donde vive el hallazgo real que ya teníamos documentado como pendiente:
// existen DOS caminos distintos en el backend para vincular un repuesto con un
// distribuidor, y no se comportan igual:
//   - asignarDistribuidor (usada por el frontend real, Repuesto.js): SÍ reemplaza cualquier
//     asignación previa antes de crear la nueva. Este es el camino correcto para CP-076.
//   - crearRelacion (existe en el controlador pero el frontend no la usa hoy): NO reemplaza
//     nada, solo inserta. Si alguien la llamara directamente (por ejemplo, integrando otro
//     sistema contra esta misma API), un repuesto podría terminar con más de un
//     distribuidor asignado al mismo tiempo, aunque la base de datos garantiza que no se
//     repita el MISMO par (repuesto, distribuidor) dos veces.

jest.mock('../model/repuestoDistribuidorModelo');
jest.mock('../utils/manejarError');

const { asignarDistribuidor, crearRelacion } = require('../controller/repuestoDistribuidorController');
const rd_mo = require('../model/repuestoDistribuidorModelo');
const manejarError = require('../utils/manejarError');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M5.5 — Gestionar repuestos por distribuidor (camino usado por el frontend real)', () => {
    test('CP-075 — Debería asignar un repuesto a un distribuidor correctamente', async () => {
        rd_mo.asignar.mockResolvedValue(10);

        const req = { body: { id_repuestos: '1', id_distribuidor: '5' } };
        const res = crearRes();

        await asignarDistribuidor(req, res);

        expect(rd_mo.asignar).toHaveBeenCalledWith('1', '5');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-076 — Reasignar a otro distribuidor: se delega en el modelo, que reemplaza la asignación previa antes de crear la nueva', async () => {
        rd_mo.asignar.mockResolvedValue(11);

        // El repuesto '1' ya estaba asignado al distribuidor '5'; ahora se reasigna al '9'.
        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } };
        const res = crearRes();

        await asignarDistribuidor(req, res);

        expect(rd_mo.asignar).toHaveBeenCalledWith('1', '9');
        expect(res.status).toHaveBeenCalledWith(200);
        // Nota: la garantía real de "reemplaza lo anterior" vive dentro de rd_mo.asignar
        // (a nivel de modelo/SQL), no en este controlador — aquí solo se confirma que el
        // controlador delega correctamente.
    });
});

describe('RF-M5.5 — El otro camino existente (crearRelacion) NO reemplaza asignaciones previas', () => {
    test('Confirma el hallazgo: crearRelacion inserta sin verificar si el repuesto ya tenía otro distribuidor', async () => {
        rd_mo.create.mockResolvedValue(20);

        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } }; // mismo repuesto que arriba, otro distribuidor
        const res = crearRes();

        await crearRelacion(req, res);

        // A diferencia de asignarDistribuidor, aquí NO se llama a ningún método que borre
        // la asignación anterior — solo crea una fila nueva. Si el repuesto '1' ya tenía
        // una relación con el distribuidor '5', ahora tendría relaciones con DOS
        // distribuidores a la vez.
        expect(rd_mo.create).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Solo la base de datos evita el duplicado EXACTO (mismo repuesto + mismo distribuidor dos veces)', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        rd_mo.create.mockRejectedValue(error);

        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } };
        const res = crearRes();

        await crearRelacion(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Ese repuesto ya está vinculado a ese distribuidor' });
    });
});