// RF-M3.5 — Eliminar historial
// Casos de prueba asociados: CP-085, CP-086, CP-087, CP-088
//
// FALTA respecto al documento de Casos de Prueba, y por qué:
//   - CP-088 Recepcionista intenta eliminar (denegado): NO SE PUDO VERIFICAR. El controlador
//     (eliminarHistorial) no tiene ninguna regla que bloquee a Recepcionista específicamente
//     — la única restricción que sí existe en el código es la del Cliente con técnico
//     asignado. Si Recepcionista está bloqueada, tendría que ser a nivel de ruta
//     (historialRutas.js), y no tengo ese archivo para confirmarlo. Pendiente de revisar
//     con el archivo de rutas real.

jest.mock('../model/historialModelo');

const { eliminarHistorial } = require('../controller/HistorialController');
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

describe('RF-M3.5 — Eliminar historial', () => {
    test('CP-086 — Debería retornar 404 si el registro no existe', async () => {
        historial_mo.findById.mockResolvedValue(undefined);

        const req = { usuario: { rol: 3 }, params: { id: '99' } };
        const res = crearRes();

        await eliminarHistorial(req, res);

        expect(historial_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-085 — Cliente: eliminación exitosa mientras no tenga técnico asignado', async () => {
        historial_mo.findById.mockResolvedValue({ id_historial: 1, id_tecnico: null });
        historial_mo.delete.mockResolvedValue(true);

        const req = { usuario: { rol: 3 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarHistorial(req, res);

        expect(historial_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-087 — Con técnico asignado, el Cliente ya NO puede eliminar (requiere Administrador)', async () => {
        historial_mo.findById.mockResolvedValue({ id_historial: 1, id_tecnico: 55 });

        const req = { usuario: { rol: 3 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarHistorial(req, res);

        expect(historial_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('CP-087b — Administrador SÍ puede eliminar aunque ya tenga técnico asignado', async () => {
        historial_mo.findById.mockResolvedValue({ id_historial: 1, id_tecnico: 55 });
        historial_mo.delete.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarHistorial(req, res);

        expect(historial_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        historial_mo.findById.mockRejectedValue(error);

        const req = { usuario: { rol: 1 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarHistorial(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});