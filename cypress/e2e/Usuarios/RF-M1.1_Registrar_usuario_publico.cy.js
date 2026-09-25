// RF-M1.1 — Registrar usuario (público)
// Casos de prueba: CP-001, CP-002, CP-003, CP-004, CP-005

const IDENTIDAD_NUEVA = '1900000099';
const CORREO_NUEVO = 'nuevo.pruebas@gmail.com';

function diligenciarRegistro(datos) {
  cy.get('#registro-identidad').clear().type(datos.identidad);
  cy.get('#registro-tipo-documento').select('Cedula de Ciudadania');
  cy.get('#registro-nombre').clear().type(datos.nombre);
  cy.get('#registro-apellido').clear().type(datos.apellido);
  cy.get('#registro-fecha-nacimiento').clear().type(datos.nacimiento);
  cy.get('#registro-celular').clear().type(datos.celular);
  cy.get('#registro-email').clear().type(datos.correo);
  cy.get('#registro-contrasena').clear().type(datos.contrasena, { log: false });
}

const BASE = {
  identidad: IDENTIDAD_NUEVA,
  nombre: 'Nuevo',
  apellido: 'Usuario',
  nacimiento: '1996-04-12',
  celular: '3001110099',
  correo: CORREO_NUEVO,
  contrasena: 'Sigat2026!',
};

describe('RF-M1.1 — Registrar usuario (público)', () => {
  beforeEach(() => {
    cy.task('ejecutarBD', {
      sql: 'DELETE FROM usuarios WHERE numero_identidad = ? OR correo_electronico = ?',
      valores: [IDENTIDAD_NUEVA, CORREO_NUEVO],
    });
    cy.visit('/Registarse');
  });

  it('CP-001 — Una persona sin cuenta se registra y entra al panel con rol Cliente', () => {
    diligenciarRegistro(BASE);
    cy.contains('button', 'Registrarse').click();

    cy.url().should('include', '/panel');

    // El sistema debe crear la cuenta siempre con rol Cliente (3),
    // sin importar lo que se envíe desde el formulario.
    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: [IDENTIDAD_NUEVA],
    }).then((filas) => {
      expect(filas).to.have.length(1);
      expect(Number(filas[0].id_rol)).to.eq(3);
    });
  });

  it('CP-002 — Rechaza un número de identidad que ya existe', () => {
    diligenciarRegistro({ ...BASE, identidad: '1900000001', correo: 'otro.pruebas@gmail.com' });
    cy.contains('button', 'Registrarse').click();

    cy.verAviso('registro');
    cy.url().should('not.include', '/panel');
  });

  it('CP-003 — Rechaza un correo electrónico que ya existe', () => {
    diligenciarRegistro({ ...BASE, correo: 'cliente.pruebas@gmail.com' });
    cy.contains('button', 'Registrarse').click();

    cy.verAviso('registro');
    cy.url().should('not.include', '/panel');
  });

  it('CP-004 — Rechaza el registro si quedan campos obligatorios vacíos', () => {
    cy.get('#registro-identidad').clear().type(IDENTIDAD_NUEVA);
    cy.contains('button', 'Registrarse').click();

    cy.verAviso('Todos los campos obligatorios');
    cy.url().should('not.include', '/panel');
  });

  it('CP-005 — Rechaza el registro de una persona menor de edad', () => {
    const hoy = new Date();
    const menor = new Date(hoy.getFullYear() - 15, hoy.getMonth(), hoy.getDate());
    const fecha = menor.toISOString().slice(0, 10);

    diligenciarRegistro({ ...BASE, nacimiento: fecha });
    cy.contains('button', 'Registrarse').click();

    cy.verAviso('mayor de 18 años');
    cy.url().should('not.include', '/panel');
  });
});
