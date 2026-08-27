// RF-M8.1 — Consultar técnicos
// Casos de prueba asociados: CP-089, CP-090
// AVISO: estos mismos números (CP-089 a CP-091) ya se usaron en RF-M3.6 (generación de
// documentación de historial). Misma duplicidad de numeración que ya señalamos en varias
// épicas anteriores (M5, M6, M7).
//
// FALTA: CP-090 Consulta por técnico (propia ficha) — SE ESCRIBIÓ abajo, pero el código
// actual (ListarTecnico) NO filtra por identidad en absoluto: siempre llama a
// tecnico_mo.findAll() sin ningún parámetro, sin importar quién pregunte. Un Técnico ve la
// ficha de TODOS los técnicos, no solo la suya. Queda con test.skip porque el código no
// bloquea esto todavía (sería el mismo patrón que ya usan listarMotos/listarHistrial con
// su filtroIdentidad).

jest.mock('../model/tecnicoModelo');

const { ListarTecnico } = require('../controller/tecnicoController');
const tecnico_mo = require('../model/tecnicoModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M8.1 — Consultar técnicos', () => {
    test('CP-089 (RF-M8) — Administrador: debería ver el listado completo de técnicos', async () => {
        tecnico_mo.findAll.mockResolvedValue([
            { id_tecnico: 1, nombre: 'Pedro', reparaciones_asignadas: 3 },
            { id_tecnico: 2, nombre: 'Luis', reparaciones_asignadas: 1 }
        ]);

        const req = { usuario: { rol: 1 }, query: {} };
        const res = crearRes();

        await ListarTecnico(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.tecnico).toHaveLength(2);
    });

    test.skip('CP-090 — Un Técnico debería ver SOLO su propia ficha, no la de todos (pendiente de implementar)', async () => {
        tecnico_mo.findAll.mockResolvedValue([
            { id_tecnico: 1, numero_identidad: '111', nombre: 'Pedro' },
            { id_tecnico: 2, numero_identidad: '222', nombre: 'Luis' }
        ]);

        const req = { usuario: { rol: 2, id: '111' }, query: {} }; // el Técnico logueado es Pedro
        const res = crearRes();

        await ListarTecnico(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.tecnico).toHaveLength(1);
        expect(respuesta.tecnico[0].numero_identidad).toBe('111');
    });
});