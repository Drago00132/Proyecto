// RF-M4.2 — Consultar motocicleta
// Casos de prueba asociados: CP-099, CP-100, CP-101, CP-102
//
// FALTAN respecto al documento de Casos de Prueba, y por qué:
//   - CP-102 Técnico intenta ver detalle (denegado): igual que encontramos en RF-M2.2 con
//     los repuestos, motosRutas.js hoy da acceso a Técnico tanto en /listar como en
//     /consultar/:id (verificarRol(1,2,3,16,17) en ambas). Si se probara como prueba de
//     integración de ruta, HOY PASARÍA lo contrario de lo que pide este CP.
//   - Hallazgo aparte, fuera de los CP numerados: RF-M4.2 pide "búsqueda por placa", pero
//     obtenerMotos busca por motos_mo.findById(req.params.id) — es decir, por el ID interno
//     de la moto, no por la placa. No existe ningún endpoint de búsqueda por placa (a
//     diferencia de repuestos, que sí tiene GET /repuestos/buscar por nombre). Esto es un
//     vacío real del requisito, no solo un CP sin probar.

jest.mock('../model/motosModelo');
jest.mock('../utils/manejarError');

const { listarMotos, obtenerMotos } = require('../controller/motosController');
const motos_mo = require('../model/motosModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M4.2 — Consultar motocicleta', () => {
    test('CP-099 — Cliente: solo debería consultar sus propias motos (filtroIdentidad = su id)', async () => {
        motos_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 3, id: '555' }, query: {} };
        const res = crearRes();

        await listarMotos(req, res);

        expect(motos_mo.findAll).toHaveBeenCalledWith('555');
    });

    test('CP-100 — Administrador: debería ver TODAS las motos (filtroIdentidad = null)', async () => {
        motos_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 1, id: '1' }, query: {} };
        const res = crearRes();

        await listarMotos(req, res);

        expect(motos_mo.findAll).toHaveBeenCalledWith(null);
    });

    test('CP-101 — Técnico: debería poder ver el listado general (filtroIdentidad = null, ve todas)', async () => {
        motos_mo.findAll.mockResolvedValue([{ id_motos: 1 }, { id_motos: 2 }]);

        const req = { usuario: { rol: 2, id: '2' }, query: {} };
        const res = crearRes();

        await listarMotos(req, res);

        expect(motos_mo.findAll).toHaveBeenCalledWith(null);
        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.motos).toHaveLength(2);
    });

    test('Debería retornar 404 si la moto consultada por id no existe', async () => {
        motos_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerMotos(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 200 con la moto si existe (búsqueda actual: por id, no por placa)', async () => {
        const moto = { id_motos: 1, placa: 'ABC123' };
        motos_mo.findById.mockResolvedValue(moto);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await obtenerMotos(req, res);

        expect(motos_mo.findById).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith(moto);
    });
});