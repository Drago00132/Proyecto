// RF-M3.2 — Consultar historial
// Casos de prueba asociados: CP-071, CP-072, CP-073, CP-074, CP-075
//
// FALTA respecto al documento de Casos de Prueba:
//   - CP-075 Filtro por número (de placa o documento, no se especifica cuál): no está
//     implementado. listarHistrial solo filtra por identidad completa (todo o nada, según
//     el rol), no admite un parámetro de búsqueda parcial todavía.

jest.mock('../model/historialModelo');
jest.mock('../utils/manejarError');

const { listarHistrial, obtenerHistorial } = require('../controller/HistorialController');
const historial_mo = require('../model/historialModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M3.2 — Consultar historial', () => {
    test('CP-071 — Cliente: solo debería consultar su propio historial (filtroIdentidad = su id)', async () => {
        historial_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 3, id: '555' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(historial_mo.findAll).toHaveBeenCalledWith('555');
    });

    test('CP-072 — Técnico: solo debería consultar lo que tiene asignado (filtroIdentidad = su id)', async () => {
        historial_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 2, id: '222' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(historial_mo.findAll).toHaveBeenCalledWith('222');
    });

    test('CP-073 — Recepcionista: debería ver TODO el historial (filtroIdentidad = null)', async () => {
        historial_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 16, id: '16' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(historial_mo.findAll).toHaveBeenCalledWith(null);
    });

    test('CP-074 — Administrador: debería ver TODO el historial (filtroIdentidad = null)', async () => {
        historial_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 1, id: '1' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(historial_mo.findAll).toHaveBeenCalledWith(null);
    });

    test('Súper Administrador también debería ver TODO el historial (filtroIdentidad = null) — bug ya corregido', async () => {
        historial_mo.findAll.mockResolvedValue([]);

        const req = { usuario: { rol: 17, id: '17' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(historial_mo.findAll).toHaveBeenCalledWith(null);
    });

    test('Debería agrupar correctamente varias filas del mismo historial (repuestos múltiples) en un solo registro', async () => {
        historial_mo.findAll.mockResolvedValue([
            { id_historial: 1, id_motos: 10, placa: 'ABC123', nombre_repuesto: 'Bujía', cantidad: 2 },
            { id_historial: 1, id_motos: 10, placa: 'ABC123', nombre_repuesto: 'Filtro', cantidad: 1 }
        ]);

        const req = { usuario: { rol: 1, id: '1' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.totalItems).toBe(1);
        expect(respuesta.historial[0].repuestos).toHaveLength(2);
    });

    test('Debería retornar 404 si el historial consultado no existe', async () => {
        historial_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerHistorial(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 200 incluyendo los repuestos del historial consultado', async () => {
        historial_mo.findById.mockResolvedValue({ id_historial: 1, id_motos: 10 });
        historial_mo.getRepuestosByHistorial.mockResolvedValue([{ id_repuestos: 1, cantidad: 2 }]);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await obtenerHistorial(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.repuestos).toEqual([{ id_repuestos: 1, cantidad: 2 }]);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        historial_mo.findAll.mockRejectedValue(error);

        const req = { usuario: { rol: 1, id: '1' }, query: {} };
        const res = crearRes();

        await listarHistrial(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});