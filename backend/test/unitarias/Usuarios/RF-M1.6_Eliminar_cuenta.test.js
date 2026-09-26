// RF-M1.6 — Eliminar cuenta de usuario
// Casos de prueba: CP-024, CP-025, CP-027

jest.mock('../../../model/usuariosModelo');

const { eliminarUsuario } = require('../../../controller/usuariosController');
const usuario_modelo = require('../../../model/usuariosModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M1.6 — Eliminar cuenta de usuario', () => {
    test('CP-025 — Debería retornar 404 si la cuenta no existe', async () => {
        usuario_modelo.findById.mockResolvedValue(undefined);

        const req = { usuario: { rol: 1 }, params: { id: '99' } };
        const res = crearRes();

        await eliminarUsuario(req, res);

        expect(usuario_modelo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-024 — Debería eliminar correctamente y responder 200', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1', id_rol: 3 });
        usuario_modelo.delete.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarUsuario(req, res);

        expect(usuario_modelo.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-027 — Administrador NO debería poder eliminar a otro Administrador', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1', id_rol: 1 });

        const req = { usuario: { rol: 1 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarUsuario(req, res);

        expect(usuario_modelo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});