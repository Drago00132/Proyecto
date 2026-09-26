// RF-M1.8 — Carga masiva de usuarios
// Casos de prueba: CP-030, CP-031, CP-032, CP-033

jest.mock('../../../model/usuariosModelo');
jest.mock('xlsx');
jest.mock('../../../utils/manejarError');

const { cargaMasiva } = require('../../../controller/usuariosController');
const usuario_modelo = require('../../../model/usuariosModelo');
const xlsx = require('xlsx');
const manejarError = require('../../../utils/manejarError');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M1.8 — Carga masiva de técnicos', () => {
    test('CP-031 — Debería retornar 400 si no se recibió ningún archivo', async () => {
        const req = { file: undefined };
        const res = crearRes();

        await cargaMasiva(req, res);

        expect(usuario_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-030 y CP-033 — Debería forzar id_rol = 2 (Técnico) en cada fila, sin importar lo que traiga el Excel', async () => {
        xlsx.readFile.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: { Hoja1: {} } });
        xlsx.utils = {
            sheet_to_json: jest.fn().mockReturnValue([
                { numero_identidad: '1', nombre: 'Tec Uno', id_rol: 2 },
                { numero_identidad: '2', nombre: 'Intento Admin', id_rol: 1 }, 
                { numero_identidad: '3', nombre: 'Sin rol' }
            ])
        };
        usuario_modelo.create.mockResolvedValue('ok');

        const req = { file: { path: '/tmp/archivo.xlsx' } };
        const res = crearRes();

        await cargaMasiva(req, res);

        expect(usuario_modelo.create).toHaveBeenCalledTimes(3);
        usuario_modelo.create.mock.calls.forEach((llamada) => {
            expect(llamada[0].id_rol).toBe(2);
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-032 — Una fila con datos inválidos detiene todo el proceso (no continúa con las demás filas)', async () => {
        xlsx.readFile.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: { Hoja1: {} } });
        xlsx.utils = {
            sheet_to_json: jest.fn().mockReturnValue([
                { numero_identidad: '1', nombre: 'Tec Uno' },
                { numero_identidad: '', nombre: '' }, 
                { numero_identidad: '3', nombre: 'Tec Tres' }
            ])
        };
        const errorFilaInvalida = new Error('numero_identidad no puede ser nulo');
        usuario_modelo.create
            .mockResolvedValueOnce('ok')
            .mockRejectedValueOnce(errorFilaInvalida);

        const req = { file: { path: '/tmp/archivo.xlsx' } };
        const res = crearRes();

        await cargaMasiva(req, res);

        expect(usuario_modelo.create).toHaveBeenCalledTimes(2);
        expect(manejarError).toHaveBeenCalledWith(errorFilaInvalida, res, 'carga masiva de técnicos');
    });
});