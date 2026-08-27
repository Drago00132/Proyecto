// RF-M2.4 — Eliminar repuesto
// Casos de prueba asociados: CP-055, CP-056, CP-057
//
// FALTA respecto al documento de Casos de Prueba, y por qué:
//   - CP-056 Eliminación exitosa por Recepcionista: eliminarRepuesto no distingue el rol de
//     quien elimina (el control de acceso vive en repuestosRutas.js, con verificarRol
//     incluyendo el rol 16). A nivel de controlador, sería idéntica a CP-055. Si se quiere
//     probar el rol específicamente, tendría que ser una prueba de integración de ruta, no
//     una prueba unitaria de este controlador.
//
// Nota aparte (no es un CP, pero está en la Observación de este RF): el formulario real NO
// pide motivo de eliminación ni tiene casilla de confirmación aparte del modal genérico
// ConfirmarEliminar — solo un botón simple. No hay nada que probar de eso a nivel de
// backend porque el backend nunca esperó ese dato.

jest.mock('../model/repuestoModelo');

const { eliminarRepuesto } = require('../controller/repuestosController');
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

describe('RF-M2.4 — Eliminar repuesto', () => {
    test('CP-055 — Debería eliminar correctamente y responder 200', async () => {
        repuesto_mo.findById.mockResolvedValue({ id_repuestos: 1 });
        repuesto_mo.delete.mockResolvedValue(true);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(repuesto_mo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-057 — Debería retornar 404 si el repuesto no existe', async () => {
        repuesto_mo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(repuesto_mo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        repuesto_mo.findById.mockRejectedValue(error);

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarRepuesto(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});