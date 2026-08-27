// RF-M1.4 — Editar perfil propio
// Cubre TANTO la autoedición (obtenerMiPerfil/actualizarMiPerfil) COMO la edición de otros
// usuarios por personal interno (actualizarUsuario) — el documento RF/RNF describe las dos
// cosas dentro del mismo requisito ("El personal interno autorizado podrá editar además
// datos de otros usuarios, respetando las mismas restricciones...").
//
// Casos de prueba asociados: CP-014, CP-015, CP-016, CP-017, CP-018
//
// FALTAN respecto al documento de Casos de Prueba:
//   - CP-015 Intento de edición de documento (bloqueado): no había una prueba que confirmara
//     específicamente que mandar numero_identidad en el body de actualizarMiPerfil no tiene
//     ningún efecto (antes solo se probaba que id_rol/contrasena se ignoran). Se agrega abajo.
//   - CP-016 Edición de rol por Súper Administrador: no había un caso específico para esta
//     combinación. Se agrega abajo.
//   - CP-017 Administrador intenta editar a otro Administrador (denegado): existía una
//     prueba genérica de "403 si el rol no está permitido", pero no este caso puntual.
//   - CP-018 Recepcionista intenta editar a un Técnico (denegado): no existía. Se agrega abajo.

jest.mock('../model/usuariosModelo');

const { actualizarUsuario, obtenerMiPerfil, actualizarMiPerfil } = require('../controller/usuariosController');
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

describe('RF-M1.4 — Autoedición del propio perfil', () => {
    test('CP-014 — Debería actualizar el propio perfil correctamente', async () => {
        usuario_modelo.updatePerfilPropio.mockResolvedValue(true);

        const req = {
            usuario: { id: '55' },
            body: { nombre: 'Nuevo Nombre', apellido: 'Nuevo Apellido', correo_electronico: 'nuevo@correo.com', numero_celular: '3001234567' }
        };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilPropio).toHaveBeenCalledWith('55', expect.objectContaining({ nombre: 'Nuevo Nombre' }));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-015 — Intentar cambiar el número de identidad (numero_identidad) no tiene ningún efecto', async () => {
        usuario_modelo.updatePerfilPropio.mockResolvedValue(true);

        const req = {
            usuario: { id: '55' },
            body: { nombre: 'Nombre', correo_electronico: 'correo@correo.com', numero_identidad: '999999999' } // intento de cambiar el documento
        };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        const datosEnviados = usuario_modelo.updatePerfilPropio.mock.calls[0][1];
        expect(datosEnviados).not.toHaveProperty('numero_identidad');
    });

    test('Debería retornar 400 si falta el nombre o el correo', async () => {
        const req = { usuario: { id: '55' }, body: { nombre: '', correo_electronico: 'yo@correo.com' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilPropio).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería usar siempre el id del token (req.usuario.id), nunca uno de params', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '55', nombre: 'Yo Mismo', contrasena: 'hash' });

        const req = { usuario: { id: '55' }, params: { id: '999' } };
        const res = crearRes();

        await obtenerMiPerfil(req, res);

        expect(usuario_modelo.findById).toHaveBeenCalledWith('55');
        expect(res.json).toHaveBeenCalledWith({ numero_identidad: '55', nombre: 'Yo Mismo' });
    });
});

describe('RF-M1.4 — Edición de otros usuarios por personal interno', () => {
    const datosBase = {
        tipo_documento: 'Cedula de Ciudadania',
        nombre: 'Cliente Uno',
        fecha_nacimiento: '2000-01-01',
        correo_electronico: 'cliente@correo.com'
    };

    test('Debería retornar 404 si el usuario a editar no existe', async () => {
        usuario_modelo.findById.mockResolvedValue(undefined);

        const req = { usuario: { rol: 1 }, params: { id: '99' }, body: { ...datosBase, id_rol: 3 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.update).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('CP-016 — Súper Administrador SÍ puede editar el rol de un usuario (ej. subirlo a Administrador)', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1' });
        usuario_modelo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 17 }, params: { id: '1' }, body: { ...datosBase, id_rol: 1 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.update).toHaveBeenCalledWith('1', expect.objectContaining({ id_rol: 1 }));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('CP-017 — Administrador NO puede editar a otro Administrador', async () => {
        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { ...datosBase, id_rol: 1 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('CP-018 — Recepcionista NO puede editar a un Técnico', async () => {
        const req = { usuario: { rol: 16 }, params: { id: '1' }, body: { ...datosBase, id_rol: 2 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('Debería actualizar correctamente cuando el rol de destino sí está permitido', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1' });
        usuario_modelo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { ...datosBase, id_rol: 3 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.update).toHaveBeenCalledWith('1', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});