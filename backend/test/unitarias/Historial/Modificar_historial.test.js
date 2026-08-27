// RF-M3.3 — Modificar historial
// Casos de prueba asociados: CP-076, CP-077, CP-078, CP-079, CP-080
// Los 5 CP ya están cubiertos; no falta ninguno.
//
// Nota sobre CP-078: el actor principal de este RF es Técnico/Administrador, no Cliente. El
// Cliente SÍ puede tocar el formulario de edición (para su propia descripción y fotos, ver
// RF-M1.4/RF-M3.1), pero "modificar" en el sentido de este RF-M3.3 se refiere a los campos
// técnicos (estado, diagnóstico) — y esos SÍ están bloqueados para él, que es lo que prueba
// el caso de abajo.

jest.mock('../model/historialModelo');
jest.mock('../utils/manejarError');

const { actualizarHistorial } = require('../controller/HistorialController');
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

function historialBase(overrides = {}) {
    return {
        id_historial: 1,
        id_motos: 10,
        id_tecnico: null,
        id_historial_cliente: 1,
        descripcion_prodlema: 'No enciende',
        estado: 'En Asignacion',
        descripcion_trabajo: null,
        fotos: null,
        fecha_inicio: '2026-08-01',
        fecha_fin: null,
        ...overrides
    };
}

describe('RF-M3.3 — Modificar historial', () => {
    test('CP-076 — Técnico: modificación exitosa (diagnóstico, estado), sin poder cambiar id_motos', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_motos: 10 }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = {
            usuario: { rol: 2 },
            params: { id: '1' },
            body: { id_motos: '999', descripcion_trabajo: 'Se cambió aceite', estado: 'En Proceso' }
        };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_motos).toBe(10); // no cambia, campo no permitido para Técnico
        expect(datosActualizados.descripcion_trabajo).toBe('Se cambió aceite');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-077 — Debería retornar 409 si el registro ya está Finalizado y el rol no es Administrador/Súper Administrador', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ estado: 'Finalizado' }));

        const req = { usuario: { rol: 2 }, params: { id: '1' }, body: { estado: 'En Proceso' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(historial_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('Administrador SÍ puede modificar un registro ya Finalizado', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ estado: 'Finalizado' }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { descripcion_trabajo: 'Corrección de nota' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-078 — Cliente: no puede modificar el estado ni el diagnóstico técnico (queda ignorado, no denegado del todo)', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: null }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = {
            usuario: { rol: 3 },
            params: { id: '1' },
            body: { descripcion_prodlema: 'Aclaración', estado: 'Finalizado', descripcion_trabajo: 'Intento de diagnóstico' }
        };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.estado).toBe('En Asignacion'); // se ignora
        expect(datosActualizados.descripcion_trabajo).toBeNull(); // se ignora
        expect(datosActualizados.descripcion_prodlema).toBe('Aclaración'); // este sí es suyo
    });

    test('CP-078b — Debería retornar 409 si el Cliente intenta editar y ya tiene técnico asignado (denegado por completo)', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: 55 }));

        const req = { usuario: { rol: 3 }, params: { id: '1' }, body: { descripcion_prodlema: 'Cambié de idea' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(historial_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('CP-079 y CP-080 — Recepcionista: solo puede tocar id_tecnico; estado y diagnóstico quedan ignorados', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: null }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = {
            usuario: { rol: 16 },
            params: { id: '1' },
            body: { id_tecnico: '77', estado: 'Finalizado', descripcion_trabajo: 'Intento de diagnóstico' }
        };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_tecnico).toBe('77'); // CP-079: permitido
        expect(datosActualizados.descripcion_trabajo).toBeNull(); // CP-080: denegado (se ignora)
    });

    test('Debería retornar 400 si, tras el merge, faltan campos obligatorios', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_motos: null, descripcion_prodlema: null }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: {} };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(historial_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        historial_mo.findById.mockRejectedValue(error);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: {} };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});