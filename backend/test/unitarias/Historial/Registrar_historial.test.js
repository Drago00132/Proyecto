
jest.mock('../../../model/historialModelo');
jest.mock('../../../utils/manejarError');

const { agregarHistorial } = require('../../../controller/HistorialController');
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

describe('RF-M3.1 — Registrar historial', () => {
    test('CP-068 — Debería retornar 400 si la descripción del problema viene vacía', async () => {
        const req = { usuario: { rol: 3 }, body: { id_motos: '10', descripcion_prodlema: '' } };
        const res = crearRes();

        await agregarHistorial(req, res);

        expect(historial_mo.tieneHistorialActivo).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-067 — Debería retornar 409 si la moto ya tiene un historial activo (RN-010)', async () => {
        historial_mo.tieneHistorialActivo.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, body: { id_motos: '10', descripcion_prodlema: 'No enciende' } };
        const res = crearRes();

        await agregarHistorial(req, res);

        expect(historial_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('CP-066 — Cliente: registro exitoso, sin poder colar estado, id_tecnico ni repuestos', async () => {
        historial_mo.tieneHistorialActivo.mockResolvedValue(false);
        historial_mo.create.mockResolvedValue(1);

        const req = {
            usuario: { rol: 3 },
            body: { id_motos: '10', descripcion_prodlema: 'No enciende', estado: 'Finalizado', id_tecnico: '99' },
            file: undefined
        };
        const res = crearRes();

        await agregarHistorial(req, res);

        const datosInsertados = historial_mo.create.mock.calls[0][0];
        expect(datosInsertados.estado).toBe('En Asignacion');
        expect(datosInsertados.id_tecnico).toBeNull();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('CP-070 — Recepcionista SÍ puede registrar un historial para la moto de cualquier cliente (el "dueño" lo determina la moto elegida, no un campo aparte)', async () => {
        historial_mo.tieneHistorialActivo.mockResolvedValue(false);
        historial_mo.create.mockResolvedValue(2);
        const req = {
            usuario: { rol: 16 },
            body: { id_motos: '10', descripcion_prodlema: 'Frenos chillan' } 
        };
        const res = crearRes();

        await agregarHistorial(req, res);

        expect(historial_mo.create).toHaveBeenCalledWith(
            expect.objectContaining({ id_motos: '10' })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('La fecha de inicio siempre la genera el sistema, en formato AAAA-MM-DD (RN-011)', async () => {
        historial_mo.tieneHistorialActivo.mockResolvedValue(false);
        historial_mo.create.mockResolvedValue(4);

        const req = {
            usuario: { rol: 1 },
            body: { id_motos: '10', descripcion_prodlema: 'Prueba de fecha automática', fecha_inicio: '1999-01-01' }
        };
        const res = crearRes();

        await agregarHistorial(req, res);

        const datosInsertados = historial_mo.create.mock.calls[0][0];
        expect(datosInsertados.fecha_inicio).not.toBe('1999-01-01');
        expect(datosInsertados.fecha_inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        historial_mo.tieneHistorialActivo.mockRejectedValue(error);

        const req = { usuario: { rol: 1 }, body: { id_motos: '10', descripcion_prodlema: 'Prueba de conexión caída' } };
        const res = crearRes();

        await agregarHistorial(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });
});