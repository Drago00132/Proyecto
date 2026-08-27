// RF-M5.2 — Consultar distribuidores
// Casos de prueba asociados: CP-071 Consulta exitosa. CP-072 Distribuidor no encontrado.
//
// AVISO: estos números (CP-071 a CP-075) ya se usaron en RF-M3.2 (consulta de historial por
// rol). Misma duplicidad de numeración que se explica en RF-M5.1.

jest.mock('../model/distribuidorModelo');
jest.mock('../utils/manejarError');

const { listarDistribuidores, obtenerDistribuidor } = require('../controller/distribuidoresController');
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

describe('RF-M5.2 — Consultar distribuidores', () => {
    test('CP-071 (RF-M5) — Debería devolver el listado paginado correctamente', async () => {
        distribuidor_mo.findAll.mockResolvedValue([
            { id_distribuidor: 1, nombre_distribuidor: 'Repuestos del Norte' },
            { id_distribuidor: 2, nombre_distribuidor: 'Motopartes SA' }
        ]);

        const req = { query: {} };
        const res = crearRes();

        await listarDistribuidores(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.distribuidores).toHaveLength(2);
    });

    test('CP-072 (RF-M5) — Debería retornar 404 si el distribuidor consultado no existe', async () => {
        distribuidor_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerDistribuidor(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería incluir los repuestos asociados al consultar un distribuidor', async () => {
        const distribuidor = {
            id_distribuidor: 1,
            nombre_distribuidor: 'Repuestos del Norte',
            repuestos: [{ id_repuestos: 1, nombre_repuesto: 'Bujía' }]
        };
        distribuidor_mo.findById.mockResolvedValue(distribuidor);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await obtenerDistribuidor(req, res);

        expect(res.json).toHaveBeenCalledWith(distribuidor);
    });
});