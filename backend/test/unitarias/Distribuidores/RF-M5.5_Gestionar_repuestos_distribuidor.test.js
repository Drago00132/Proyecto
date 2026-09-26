// RF-M5.5 — Gestionar repuestos por distribuidor
// Casos de prueba: CP-075 (M5), CP-076 (M5)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M5)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/repuestoDistribuidorModelo');
jest.mock('../../../utils/manejarError');

const { asignarDistribuidor, crearRelacion } = require('../../../controller/repuestoDistribuidorController');
const rd_mo = require('../../../model/repuestoDistribuidorModelo');
const manejarError = require('../../../utils/manejarError');

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
    test('CP-075 (M5) — Debería asignar un repuesto a un distribuidor correctamente', async () => {
        rd_mo.asignar.mockResolvedValue(10);

        const req = { body: { id_repuestos: '1', id_distribuidor: '5' } };
        const res = crearRes();

        await asignarDistribuidor(req, res);

        expect(rd_mo.asignar).toHaveBeenCalledWith('1', '5');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-076 (M5) — Reasignar a otro distribuidor: se delega en el modelo, que reemplaza la asignación previa antes de crear la nueva', async () => {
        rd_mo.asignar.mockResolvedValue(11);

        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } };
        const res = crearRes();

        await asignarDistribuidor(req, res);

        expect(rd_mo.asignar).toHaveBeenCalledWith('1', '9');
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('RF-M5.5 — crearRelacion (ya unificado con asignarDistribuidor)', () => {
    test('crearRelacion delega en rd_mo.asignar, igual que asignarDistribuidor, y responde 201', async () => {
        rd_mo.asignar.mockResolvedValue(20);

        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } };
        const res = crearRes();

        await crearRelacion(req, res);

        expect(rd_mo.asignar).toHaveBeenCalledWith('1', '9');
        expect(rd_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Si rd_mo.asignar lanza ER_DUP_ENTRY (mismo repuesto + mismo distribuidor dos veces), responde 409', async () => {
        const error = new Error('Duplicate entry');
        error.code = 'ER_DUP_ENTRY';
        rd_mo.asignar.mockRejectedValue(error);

        const req = { body: { id_repuestos: '1', id_distribuidor: '9' } };
        const res = crearRes();

        await crearRelacion(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Ese repuesto ya está vinculado a ese distribuidor' });
    });
});