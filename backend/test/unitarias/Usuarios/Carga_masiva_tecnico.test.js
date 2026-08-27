// RF-M1.8 — Carga masiva de técnicos
// Casos de prueba asociados: CP-030, CP-031, CP-032, CP-033
//
// FALTA respecto al documento de Casos de Prueba:
//   - CP-032 Fila con datos inválidos dentro del archivo: no había una prueba que verificara
//     qué pasa si una fila del Excel trae, por ejemplo, el numero_identidad vacío. Revisando
//     el código real (usuariosController.cargaMasiva), la función NO valida cada fila
//     individualmente antes de llamar a create — simplemente le pasa la fila tal cual al
//     modelo. Si el modelo/base de datos la rechaza, esa fila específica generaría un error
//     dentro del bucle. La prueba de abajo confirma ese comportamiento actual (se detiene
//     todo el proceso en la primera fila inválida, no continúa con las demás ni reporta cuál
//     fila fue). Esto es un hallazgo nuevo que vale la pena agregar a los pendientes.

jest.mock('../model/usuariosModelo');
jest.mock('xlsx');
jest.mock('../utils/manejarError');

const { cargaMasiva } = require('../controller/usuariosController');
const usuario_modelo = require('../model/usuariosModelo');
const xlsx = require('xlsx');
const manejarError = require('../utils/manejarError');

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
                { numero_identidad: '2', nombre: 'Intento Admin', id_rol: 1 }, // intenta colarse como Administrador
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

    // CP-032 (faltaba) — confirma el comportamiento REAL actual: no hay validación fila por
    // fila, así que una fila inválida interrumpe todo el proceso vía manejarError.
    test('CP-032 — Una fila con datos inválidos detiene todo el proceso (no continúa con las demás filas)', async () => {
        xlsx.readFile.mockReturnValue({ SheetNames: ['Hoja1'], Sheets: { Hoja1: {} } });
        xlsx.utils = {
            sheet_to_json: jest.fn().mockReturnValue([
                { numero_identidad: '1', nombre: 'Tec Uno' },
                { numero_identidad: '', nombre: '' }, // fila inválida: sin documento ni nombre
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

        // Se detiene en la segunda fila: la tercera fila válida nunca se llega a procesar.
        expect(usuario_modelo.create).toHaveBeenCalledTimes(2);
        expect(manejarError).toHaveBeenCalledWith(errorFilaInvalida, res, 'carga masiva de técnicos');
    });
});