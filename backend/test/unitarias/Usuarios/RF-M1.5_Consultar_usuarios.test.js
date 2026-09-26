// RF-M1.5 — Consultar usuarios registrados
// Casos de prueba: CP-019

jest.mock('../../../model/usuariosModelo');
jest.mock('../../../model/RoleModelo');

const { listarUsuarios, obtenerUsuario, obtenerRolesAsignables } = require('../../../controller/usuariosController');
const usuario_modelo = require('../../../model/usuariosModelo');
const rolModelo = require('../../../model/RoleModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M1.5 — Consultar usuarios registrados', () => {
    test('CP-019 — Debería devolver el listado paginado sin exponer la contraseña de nadie', async () => {
        usuario_modelo.findAll.mockResolvedValue([
            { numero_identidad: '1', nombre: 'Ana', contrasena: 'hash-secreto-1' },
            { numero_identidad: '2', nombre: 'Beto', contrasena: 'hash-secreto-2' }
        ]);

        const req = { query: {} };
        const res = crearRes();

        await listarUsuarios(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.usuarios).toHaveLength(2);
        respuesta.usuarios.forEach((u) => expect(u).not.toHaveProperty('contrasena'));
    });

    test('Debería retornar 404 si el usuario consultado no existe', async () => {
        usuario_modelo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await obtenerUsuario(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    const todosLosRoles = [
        { id_rol: 1, rol: 'administrador' },
        { id_rol: 2, rol: 'tecnico' },
        { id_rol: 3, rol: 'cliente' },
        { id_rol: 16, rol: 'Recepcionista' },
        { id_rol: 17, rol: 'super admin' }
    ];

    test('Un Administrador debería recibir solo Técnico, Cliente y Recepcionista como opciones', async () => {
        rolModelo.findAll.mockResolvedValue(todosLosRoles);

        const req = { usuario: { rol: 1 } };
        const res = crearRes();

        await obtenerRolesAsignables(req, res);

        const respuesta = res.json.mock.calls[0][0];
        const ids = respuesta.roles.map((r) => r.id_rol).sort((a, b) => a - b);
        expect(ids).toEqual([2, 3, 16]);
    });

    test('Una Recepcionista debería recibir solo Cliente como opción', async () => {
        rolModelo.findAll.mockResolvedValue(todosLosRoles);

        const req = { usuario: { rol: 16 } };
        const res = crearRes();

        await obtenerRolesAsignables(req, res);

        const respuesta = res.json.mock.calls[0][0];
        expect(respuesta.roles.map((r) => r.id_rol)).toEqual([3]);
    });
});