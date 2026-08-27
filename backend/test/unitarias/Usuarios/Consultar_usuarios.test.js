// RF-M1.5 — Consultar usuarios registrados
// Casos de prueba asociados: CP-019, CP-020, CP-021, CP-022, CP-023
//
// FALTAN respecto al documento de Casos de Prueba, y por qué:
//   - CP-020 Consulta exitosa por Recepcionista: técnicamente no hay diferencia en el
//     controlador (listarUsuarios no distingue el rol de quien consulta), así que esta
//     prueba sería idéntica a CP-019. No se agrega por separado porque no probaría nada
//     distinto — el control de acceso real vive en el MIDDLEWARE de la ruta, no aquí.
//   - CP-021 Acceso denegado a Técnico / CP-022 Acceso denegado a Cliente: estos dos NO SE
//     PUEDEN escribir como pruebas unitarias del controlador, porque quién puede o no
//     acceder a esta ruta lo decide el middleware verificarRol en usuariosRoutes.js, no
//     usuariosController.listarUsuarios. Y aquí está el problema real (ya documentado en
//     RF-M1.5): esa ruta hoy tiene verificarRol(1,2,3,16,17) — permite a TODOS los roles,
//     incluidos Técnico y Cliente. O sea que si escribiéramos CP-021/CP-022 como pruebas de
//     integración de la ruta, HOY FALLARÍAN, porque el sistema no los bloquea. Esto
//     confirma el hallazgo pendiente: la ruta debería ser verificarRol(1,16,17) solamente.
//   - CP-023 Filtro por rol: no implementado en absoluto (ni en el controlador ni en el
//     frontend); no hay nada que probar todavía.

jest.mock('../model/usuariosModelo');
jest.mock('../model/RoleModelo');

const { listarUsuarios, obtenerUsuario, obtenerRolesAsignables } = require('../controller/usuariosController');
const usuario_modelo = require('../model/usuariosModelo');
const rolModelo = require('../model/RoleModelo');

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

    // Selector de roles asignables: filtra según quién pregunta, la parte que sí puede
    // probarse a nivel de controlador dentro de este RF.
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