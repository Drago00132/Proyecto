// RF-M7.4 — Eliminar rol
// Casos de prueba asociados: CP-086, CP-087, CP-088
// AVISO: mismos números que CP-086 a 088 de RF-M3.5. Misma duplicidad ya señalada.
// Los 3 CP ya estaban cubiertos; no falta ninguno.

jest.mock('../model/RoleModelo');
jest.mock('../utils/manejarError');

const { eliminarRol } = require('../controller/RolController');
const Rol_modelo = require('../model/RoleModelo');
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

describe('RF-M7.4 — Eliminar rol (RN-023 y RN-024)', () => {
    test('Debería retornar 404 si el rol a eliminar no existe', async () => {
        Rol_modelo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(Rol_modelo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-087 (RF-M7) — Debería retornar 409 si el rol es uno de los roles base', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 1, rol: 'administrador' });

        const req = { params: { id: '1' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(Rol_modelo.contarUsuariosPorRol).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('rol base') }));
    });

    test('Debería detectar un rol base aunque tenga mayúsculas y un espacio de más (caso real "Recepcionista ")', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 16, rol: 'Recepcionista ' });

        const req = { params: { id: '16' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('CP-088 (RF-M7) — Debería retornar 409 si el rol tiene usuarios asignados', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 20, rol: 'Supervisor' });
        Rol_modelo.contarUsuariosPorRol.mockResolvedValue(3);

        const req = { params: { id: '20' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(Rol_modelo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('3 usuario(s)') }));
    });

    test('CP-086 (RF-M7) — Debería eliminar el rol si no es base y no tiene usuarios asignados', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 20, rol: 'Supervisor' });
        Rol_modelo.contarUsuariosPorRol.mockResolvedValue(0);
        Rol_modelo.delete.mockResolvedValue(true);

        const req = { params: { id: '20' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(Rol_modelo.delete).toHaveBeenCalledWith('20');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería retornar 503 si la base de datos no está disponible', async () => {
        const error = new Error('conexión rechazada');
        error.code = 'ECONNREFUSED';
        Rol_modelo.findById.mockRejectedValue(error);

        const req = { params: { id: '20' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
    });

    test('Debería retornar 409 si la base de datos rechaza el borrado por una llave foránea (respaldo)', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 20, rol: 'Supervisor' });
        Rol_modelo.contarUsuariosPorRol.mockResolvedValue(0);
        const error = new Error('FK constraint fails');
        error.code = 'ER_ROW_IS_REFERENCED_2';
        Rol_modelo.delete.mockRejectedValue(error);

        const req = { params: { id: '20' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('Debería delegar a manejarError ante cualquier otro error inesperado', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 20, rol: 'Supervisor' });
        Rol_modelo.contarUsuariosPorRol.mockResolvedValue(0);
        const error = new Error('algo raro pasó');
        Rol_modelo.delete.mockRejectedValue(error);

        const req = { params: { id: '20' } };
        const res = crearRes();

        await eliminarRol(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });
});