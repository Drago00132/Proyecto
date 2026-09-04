// RF-M3.4 — Asignar técnico a historial
// Casos de prueba asociados: CP-081, CP-082, CP-083, CP-084
//
// FALTAN respecto al documento de Casos de Prueba, y por qué:
//   - CP-083 Intento de asignar en registro cerrado: OJO, este caso queda documentado abajo
//     con un resultado que puede sorprenderte. El código actual SÍ permite que un
//     Administrador reasigne técnico en un historial Finalizado (solo evita que el estado
//     se autoavance a "En Proceso" otra vez) — no lo bloquea del todo como parece pedir este
//     CP. Si la intención real es que NADIE pueda reasignar técnico en un registro cerrado
//     (ni siquiera Administrador), falta agregar esa validación explícita.
//   - CP-084 Búsqueda de técnico por nombre: no implementada. El formulario de "Asignar
//     técnico" (AsignarTecnico.js) usa un <select> con todos los técnicos, sin buscador.

jest.mock('../model/historialModelo');

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

describe('RF-M3.4 — Asignar técnico a historial', () => {
    test('CP-081 — Administrador: asignación exitosa, el estado avanza a "En Proceso"', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: null, estado: 'En Asignacion' }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { id_tecnico: '77' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_tecnico).toBe('77');
        expect(datosActualizados.estado).toBe('En Proceso');
    });

    test('CP-082 — Recepcionista: asignación exitosa, el estado también avanza a "En Proceso"', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: null, estado: 'En Asignacion' }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 16 }, params: { id: '1' }, body: { id_tecnico: '88' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_tecnico).toBe('88');
        expect(datosActualizados.estado).toBe('En Proceso');
    });

    test('Si se reenvía el MISMO técnico que ya tenía, el estado no se reinicia a "En Proceso" a la fuerza', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: 77, estado: 'Finalizado' }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { id_tecnico: '77' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.estado).toBe('Finalizado');
    });

    test('CP-083 (comportamiento real, no el esperado) — Administrador SÍ puede reasignar técnico en un registro Finalizado; solo no se autoavanza el estado', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: 1, estado: 'Finalizado' }));
        historial_mo.getRepuestosByHistorial.mockResolvedValue([]);
        historial_mo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { id_tecnico: '999' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        // El cambio de técnico SÍ se guarda (no se bloquea); solo el estado se queda igual.
        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_tecnico).toBe('999');
        expect(datosActualizados.estado).toBe('Finalizado');
        expect(res.status).toHaveBeenCalledWith(200); // no es un 409/403, se permitió
    });

    test('Un rol distinto a Administrador/Súper Administrador NO puede tocar un registro Finalizado en absoluto (incluida la asignación de técnico)', async () => {
        historial_mo.findById.mockResolvedValue(historialBase({ id_tecnico: 1, estado: 'Finalizado' }));

        const req = { usuario: { rol: 16 }, params: { id: '1' }, body: { id_tecnico: '999' } };
        const res = crearRes();

        await actualizarHistorial(req, res);

        expect(historial_mo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });
});