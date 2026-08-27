// RF-M7.2 — Consultar roles
// Casos de prueba asociados: CP-084 Consulta exitosa.
// AVISO: mismo número que CP-084 de RF-M3.5. Misma duplicidad de numeración ya señalada.

jest.mock('../model/RoleModelo');
jest.mock('../utils/manejarError');

const { ListarRol, obtenerRol } = require('../controller/RolController');
const Rol_modelo = require('../model/RoleModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M7.2 — Consultar roles', () => {
    test('CP-084 (RF-M7) — Debería devolver el listado paginado correctamente', async () => {
        const roles = [
            { id_rol: 1, rol: 'administrador' },
            { id_rol: 2, rol: 'tecnico' },
            { id_rol: 3, rol: 'cliente' }
        ];
        Rol_modelo.findAll.mockResolvedValue(roles);

        const req = { query: {} };
        const res = crearRes();

        await ListarRol(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ rol: roles, totalItems: 3 }));
    });

    test('Debería retornar 404 si el rol consultado no existe', async () => {
        Rol_modelo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerRol(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});