// RF-M1.6 — Eliminar cuenta de usuario
// Casos de prueba asociados: CP-024, CP-025, CP-026, CP-027
//
// FALTAN respecto al documento de Casos de Prueba, y por qué:
//   - CP-026 Autoeliminación por el usuario: el controlador actual (eliminarUsuario) no
//     distingue si quien elimina es el mismo usuario que se está eliminando o no. No se
//     puede escribir esta prueba porque no hay ningún comportamiento especial que verificar
//     todavía; sería una prueba vacía.
//   - CP-027 Administrador intenta eliminar a otro Administrador (denegado): se escribió
//     abajo, pero el código actual NO bloquea este caso (confirma el hallazgo pendiente de
//     RF-M1.6). Queda marcada con test.skip para que describa el comportamiento correcto
//     sin tumbar la suite; quítale el .skip una vez que se agregue la validación real.

jest.mock('../model/usuariosModelo');

const { eliminarUsuario } = require('../controller/usuariosController');
const usuario_modelo = require('../model/usuariosModelo');

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

    test.skip('CP-027 — Administrador NO debería poder eliminar a otro Administrador (pendiente de implementar)', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1', id_rol: 1 });

        const req = { usuario: { rol: 1 }, params: { id: '1' } };
        const res = crearRes();

        await eliminarUsuario(req, res);

        expect(usuario_modelo.delete).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});