
jest.mock('../../../model/historialModelo');
jest.mock('../../../model/tecnicoModelo');

const { actualizarHistorial } = require('../../../controller/HistorialController');
const historial_mo = require('../../../model/historialModelo');

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

        const datosActualizados = historial_mo.update.mock.calls[0][1];
        expect(datosActualizados.id_tecnico).toBe('999');
        expect(datosActualizados.estado).toBe('Finalizado');
        expect(res.status).toHaveBeenCalledWith(200);
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