// RF-M5.1 — Registrar distribuidor
// Casos de prueba asociados: CP-069 Registro exitoso. CP-070 Nombre vacío.
//
// AVISO: estos mismos números (CP-069, CP-070) ya se usaron en RF-M3.1 (archivo inválido
// adjunto, y recepcionista registra en nombre del cliente). Es una duplicidad real del
// documento de Casos de Prueba original, no un error de este archivo — probablemente al
// numerar RF-M3 y RF-M5 se reinició el contador por accidente. Vale la pena corregir la
// numeración en el documento maestro para que cada CP sea único en todo el proyecto.

jest.mock('../model/distribuidorModelo');
jest.mock('../utils/manejarError');

const { crearDistribuidor } = require('../controller/distribuidoresController');
const distribuidor_mo = require('../model/distribuidorModelo');
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

describe('RF-M5.1 — Registrar distribuidor', () => {
    test('CP-070 (RF-M5) — Debería retornar 400 si el nombre viene vacío', async () => {
        const req = { body: { telefono: '3001234567' } };
        const res = crearRes();

        await crearDistribuidor(req, res);

        expect(distribuidor_mo.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('CP-069 (RF-M5) — Debería registrar el distribuidor y responder 201', async () => {
        distribuidor_mo.create.mockResolvedValue(10);

        const req = {
            body: {
                nombre_distribuidor: 'Repuestos del Norte',
                telefono: '3001234567',
                correo: 'contacto@repuestosnorte.com',
                direccion: 'Calle 10 #20-30',
                contacto: 'Juan Pérez'
            }
        };
        const res = crearRes();

        await crearDistribuidor(req, res);

        expect(distribuidor_mo.create).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('Debería delegar a manejarError ante un error inesperado', async () => {
        const error = new Error('fallo de bd');
        distribuidor_mo.create.mockRejectedValue(error);

        const req = { body: { nombre_distribuidor: 'Repuestos del Norte' } };
        const res = crearRes();

        await crearDistribuidor(req, res);

        expect(manejarError).toHaveBeenCalledWith(error, res);
    });
});