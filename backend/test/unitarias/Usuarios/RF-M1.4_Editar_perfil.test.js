// RF-M1.4 — Editar perfil propio
// Casos de prueba: CP-014, CP-015, CP-016, CP-017, CP-018

jest.mock('../../../model/usuariosModelo');

const { actualizarUsuario, obtenerMiPerfil, actualizarMiPerfil } = require('../../../controller/usuariosController');
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
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1', id_rol: 2 });
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
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: '1', id_rol: 2 });
        usuario_modelo.update.mockResolvedValue(true);

        const req = { usuario: { rol: 1 }, params: { id: '1' }, body: { ...datosBase, id_rol: 3 } };
        const res = crearRes();

        await actualizarUsuario(req, res);

        expect(usuario_modelo.update).toHaveBeenCalledWith('1', req.body);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe('RF-M1.4 — Administrador y Súper Administrador editan todos sus datos en Mi perfil', () => {
    const datosPerfil = {
        numero_identidad: '1900000010',
        tipo_documento: 'Cedula de Ciudadania',
        fecha_nacimiento: '1988-05-05',
        nombre: 'Andres',
        apellido: 'Pruebas',
        correo_electronico: 'admin.pruebas@gmail.com',
        numero_celular: '3001110010'
    };

    beforeAll(() => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_prueba';
        process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    });

    test('El administrador cambia tipo de documento y fecha sin cambiar su número: no recibe token nuevo', async () => {
        usuario_modelo.updatePerfilAdmin.mockResolvedValue(true);

        const req = { usuario: { id: 1900000010, rol: 1 }, body: { ...datosPerfil, tipo_documento: 'Pasaporte', fecha_nacimiento: '1989-01-01' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilAdmin).toHaveBeenCalledWith('1900000010', expect.objectContaining({
            numero_identidad: '1900000010', tipo_documento: 'Pasaporte', fecha_nacimiento: '1989-01-01'
        }));
        expect(usuario_modelo.updatePerfilPropio).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('token');
    });

    test('El súper administrador cambia su número de identidad y recibe un token nuevo', async () => {
        usuario_modelo.findById.mockResolvedValue(undefined);
        usuario_modelo.updatePerfilAdmin.mockResolvedValue(true);

        const req = { usuario: { id: 1900000017, rol: 17 }, body: { ...datosPerfil, numero_identidad: '1900000099' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilAdmin).toHaveBeenCalledWith('1900000017', expect.objectContaining({ numero_identidad: '1900000099' }));
        const cuerpo = res.json.mock.calls[0][0];
        expect(res.status).toHaveBeenCalledWith(200);
        expect(cuerpo.numero_identidad).toBe(1900000099);
        expect(typeof cuerpo.token).toBe('string');
    });

    test('No deja usar un número de identidad que ya tiene otro usuario', async () => {
        usuario_modelo.findById.mockResolvedValue({ numero_identidad: 1900000011 });

        const req = { usuario: { id: 1900000010, rol: 1 }, body: { ...datosPerfil, numero_identidad: '1900000011' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilAdmin).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('Rechaza un número de identidad que no tiene 10 dígitos', async () => {
        const req = { usuario: { id: 1900000010, rol: 1 }, body: { ...datosPerfil, numero_identidad: '12345' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilAdmin).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Un cliente sigue sin poder cambiar su documento aunque lo envíe', async () => {
        usuario_modelo.updatePerfilPropio.mockResolvedValue(true);

        const req = { usuario: { id: 1900000001, rol: 3 }, body: { ...datosPerfil, numero_identidad: '1900000099' } };
        const res = crearRes();

        await actualizarMiPerfil(req, res);

        expect(usuario_modelo.updatePerfilAdmin).not.toHaveBeenCalled();
        const datosEnviados = usuario_modelo.updatePerfilPropio.mock.calls[0][1];
        expect(datosEnviados).not.toHaveProperty('numero_identidad');
    });
});
