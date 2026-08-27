// RF-M2.2 — Consultar repuestos
// Casos de prueba asociados: CP-049, CP-050, CP-051, CP-052
//
// FALTAN respecto al documento de Casos de Prueba, y por qué:
//   - CP-051 Técnico accede al listado: no requiere una prueba propia — listarRepuest no
//     distingue el rol de quien consulta, así que sería idéntica a la prueba genérica de
//     "listar correctamente". El control de acceso real (quién SÍ puede entrar a este
//     endpoint) vive en el middleware de la ruta (repuestosRutas.js), no en el controlador.
//   - CP-052 Técnico intenta ver detalle (denegado): NO SE PUEDE escribir como prueba
//     unitaria de controlador, por la misma razón — repuestosRutas.js hoy permite el rol
//     Técnico en /consultar/:id, así que si esto se probara como prueba de integración de
//     la ruta, HOY PASARÍA lo contrario de lo que pide este CP (dejaría entrar al Técnico
//     en vez de bloquearlo). Vale la pena revisar si esa ruta debe restringirse más.

jest.mock('../model/repuestoModelo');
jest.mock('../utils/manejarError');

const { listarRepuest, obtenerRepuestos, buscarPorNombre } = require('../controller/repuestosController');
const repuesto_mo = require('../model/repuestoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M2.2 — Consultar repuestos', () => {
    test('Debería devolver el listado paginado correctamente', async () => {
        repuesto_mo.findAll.mockResolvedValue([
            { id_repuestos: 1, nombre_repuesto: 'Filtro de aceite' },
            { id_repuestos: 2, nombre_repuesto: 'Bujía' }
        ]);

        const req = { query: {} };
        const res = crearRes();

        await listarRepuest(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.repuesto).toHaveLength(2);
    });

    test('CP-049 — Debería retornar 200 con los resultados si hay coincidencias por nombre', async () => {
        const resultados = [{ id_repuestos: 1, nombre_repuesto: 'Bujía NGK' }];
        repuesto_mo.findByNombre.mockResolvedValue(resultados);

        const req = { query: { nombre: 'Bujía' } };
        const res = crearRes();

        await buscarPorNombre(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ repuesto: resultados });
    });

    test('CP-050 — Debería retornar 404 con "producto no encontrado" si no hay coincidencias', async () => {
        repuesto_mo.findByNombre.mockResolvedValue([]);

        const req = { query: { nombre: 'Inexistente' } };
        const res = crearRes();

        await buscarPorNombre(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'producto no encontrado' });
    });

    test('Debería retornar 400 si no se envía ningún nombre para buscar', async () => {
        const req = { query: {} };
        const res = crearRes();

        await buscarPorNombre(req, res);

        expect(repuesto_mo.findByNombre).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si el repuesto consultado por id no existe', async () => {
        repuesto_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerRepuestos(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});