// RF-M5.1 — Registrar distribuidor
// Casos de prueba: CP-069, CP-070
//
// Nota: en el documento de Casos de Prueba estos códigos vuelven a empezar en
// el módulo 5, así que CP-069 y CP-070 también existen en RF-M3.1. Se marcan
// con "(M5)" para poder distinguirlos en el informe de las pruebas.

describe('RF-M5.1 — Registrar distribuidor', () => {
  const NUEVO = 'Repuestos del Norte CP069';

  const limpiar = () => {
    cy.task('borrarDistribuidor', NUEVO);
  };

  beforeEach(() => limpiar());
  after(() => limpiar());

  /** Abre la ventana de registro desde la pantalla de Distribuidores. */
  const abrirFormulario = () => {
    cy.entrarComo('administrador');
    cy.irASeccion('distribuidores');
    cy.contains('button', 'Agregar Distribuidor').click();
    cy.contains('.modal-title', 'Agregar Nuevo Distribuidor').should('be.visible');
  };

  it('CP-069 (M5) — El administrador registra un distribuidor nuevo', () => {
    abrirFormulario();

    cy.get('#distribuidor-agregar-nombre').type(NUEVO);
    cy.get('#distribuidor-agregar-telefono').type('3007776655');
    cy.get('#distribuidor-agregar-correo').type('norte.pruebas@gmail.com');
    cy.get('#distribuidor-agregar-Direccion').type('Carrera 10 # 20-30');
    cy.get('#distribuidor-agregar-contacto').type('Luis Contacto');
    cy.contains('button', 'Agregar').click();

    cy.verAviso('reguistro Exitoso');

    cy.task('consultaBD', {
      sql: 'SELECT telefono, correo, direccion, contacto FROM distribuidores WHERE nombre_distribuidor = ?',
      valores: [NUEVO],
    }).then((filas) => {
      expect(filas, 'el distribuidor quedó registrado').to.have.length(1);
      expect(String(filas[0].telefono)).to.eq('3007776655');
      expect(filas[0].correo).to.eq('norte.pruebas@gmail.com');
      expect(filas[0].contacto).to.eq('Luis Contacto');
    });
  });

  it('CP-070 (M5) — Rechaza el registro sin nombre del distribuidor', () => {
    abrirFormulario();

    // Solo se diligencian los datos de contacto: el nombre queda vacío.
    cy.get('#distribuidor-agregar-telefono').type('3007776655');
    cy.get('#distribuidor-agregar-correo').type('sinnombre.pruebas@gmail.com');
    cy.contains('button', 'Agregar').click();

    cy.verAviso('Faltan datos obligatorio');

    cy.task('consultaBD', {
      sql: 'SELECT id_distribuidor FROM distribuidores WHERE correo = ?',
      valores: ['sinnombre.pruebas@gmail.com'],
    }).then((filas) => {
      expect(filas, 'no se guardó nada').to.have.length(0);
    });

    // El servidor tampoco lo acepta si la petición se envía por fuera.
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/distribuidores/agregar',
        body: { nombre_distribuidor: '', telefono: '3007776655' },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(400);
        expect(respuesta.body.message).to.contain('obligatorio');
      });
    });
  });
});
