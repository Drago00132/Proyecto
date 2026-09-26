// RF-M7.1 — Registrar rol
// Casos de prueba: CP-083 (M7)
//
// Nota: en el documento de Casos de Prueba la numeración vuelve a empezar
// en el módulo 5, así que estos códigos también existen en el módulo 3. Se
// marcan con "(M7)" para poder distinguirlos en el informe de las pruebas.

jest.mock('../../../model/RoleModelo');
jest.mock('../../../utils/manejarError');

const { crearRol } = require('../../../controller/RolController');
const Rol_modelo = require('../../../model/RoleModelo');

function crearRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RF-M7.1 — Registrar rol', () => {
    test('Debería retornar 400 si el nombre del rol viene vacío', async () => {
        const req = { body: { rol: '' } };
        const res = crearRes();

        await crearRol(req, res);

        expect(Rol_modelo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('Debería recortar (trim) el nombre antes de guardarlo', async () => {
        Rol_modelo.create.mockResolvedValue(20);

        const req = { body: { rol: '  Supervisor  ' } };
        const res = crearRes();

        await crearRol(req, res);

        expect(Rol_modelo.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'Supervisor' }));
    });

    test('CP-083 (M7) — Debería registrar el rol y responder 201', async () => {
        Rol_modelo.create.mockResolvedValue(20);

        const req = { body: { rol: 'Supervisor' } };
        const res = crearRes();

        await crearRol(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id_rol: 20, rol: 'Supervisor' }));
    });
});