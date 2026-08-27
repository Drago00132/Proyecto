// RF-M7.3 — Editar rol
// Casos de prueba asociados: CP-085 Edición exitosa.
// AVISO: mismo número que CP-085 de RF-M3.5. Misma duplicidad de numeración ya señalada.
//
// FALTA — y aquí no hay ni siquiera un CP numerado para esto, solo la Observación de este
// mismo RF: nada impide renombrar uno de los 5 roles base (por ejemplo, cambiar
// "administrador" a otro texto). Como varias partes del sistema dependen del NOMBRE exacto
// del rol (no solo del id_rol) para tomar decisiones, renombrarlo rompería la lógica de
// permisos en otros módulos. La prueba de abajo describe el comportamiento que DEBERÍA
// existir; queda con test.skip porque el código actual no lo bloquea.

jest.mock('../model/RoleModelo');

const { actualizarRol } = require('../controller/RolController');
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

describe('RF-M7.3 — Editar rol', () => {
    test('Debería retornar 400 si el nombre del rol viene vacío', async () => {
        const req = { params: { id: '20' }, body: { rol: '' } };
        const res = crearRes();

        await actualizarRol(req, res);

        expect(Rol_modelo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería retornar 404 si el rol a editar no existe', async () => {
        Rol_modelo.findById.mockResolvedValue(undefined);

        const req = { params: { id: '99' }, body: { rol: 'Supervisor' } };
        const res = crearRes();

        await actualizarRol(req, res);

        expect(Rol_modelo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-085 (RF-M7) — Debería actualizar el rol (con el nombre recortado) y responder 200', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 20, rol: 'Supervisor' });
        Rol_modelo.update.mockResolvedValue(true);

        const req = { params: { id: '20' }, body: { rol: '  Supervisor General  ' } };
        const res = crearRes();

        await actualizarRol(req, res);

        expect(Rol_modelo.update).toHaveBeenCalledWith('20', expect.objectContaining({ rol: 'Supervisor General' }));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test.skip('NO debería permitir renombrar uno de los 5 roles base (pendiente de implementar)', async () => {
        Rol_modelo.findById.mockResolvedValue({ id_rol: 1, rol: 'administrador' });

        const req = { params: { id: '1' }, body: { rol: 'admin-renombrado' } };
        const res = crearRes();

        await actualizarRol(req, res);

        expect(Rol_modelo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});