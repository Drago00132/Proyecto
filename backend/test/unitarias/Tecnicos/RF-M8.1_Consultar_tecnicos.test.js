// RF-M8.1 — Consultar técnicos
// Casos de prueba: CP-089 (M8), CP-090 (M8)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M8)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/tecnicoModelo');

const { ListarTecnico } = require('../../../controller/tecnicoController');
const tecnico_mo = require('../../../model/tecnicoModelo');

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
    test('CP-089 (M8) — Administrador: debería ver el listado completo de técnicos', async () => {
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

    test('CP-090 (M8) — Un Técnico debería ver SOLO su propia ficha, no la de todos', async () => {
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