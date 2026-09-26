// RF-M6.2 — Consultar entradas de repuestos
// Casos de prueba: CP-080 (M6)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M6)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/entradaRepuestoModelo');
jest.mock('../../../utils/manejarError');

const { listarEntradas, obtenerEntrada } = require('../../../controller/entradaRepuestosController');
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

describe('RF-M6.2 — Consultar entradas de repuestos', () => {
    test('CP-080 (M6) — Debería devolver el listado paginado correctamente', async () => {
        entrada_mo.findAll.mockResolvedValue([
            { id_entrada: 1, cantidad_ingresada: 20 },
            { id_entrada: 2, cantidad_ingresada: 5 }
        ]);

        const req = { query: {} };
        const res = crearRes();

        await listarEntradas(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.entradas).toHaveLength(2);
    });

    test('Debería retornar 404 si la entrada consultada no existe', async () => {
        entrada_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerEntrada(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        entrada_mo.findAll.mockRejectedValue(error);

        const req = { query: {} };
        const res = crearRes();

        await listarEntradas(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});