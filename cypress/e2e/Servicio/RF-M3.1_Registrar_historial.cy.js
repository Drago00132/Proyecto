// RF-M3.1 — Registrar historial (servicio)
// Casos de prueba: CP-066, CP-067, CP-068, CP-069, CP-070

describe('RF-M3.1 — Registrar historial', () => {
  const PROBLEMA = 'La moto no enciende en frío y suena el motor de arranque';

  beforeEach(() => {
    // Cada prueba parte sin servicios en las motos de prueba, porque una
    // moto no puede tener dos servicios abiertos al tiempo.
    cy.task('limpiarServicios');
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  it('CP-066 — El cliente registra el servicio de su propia moto', () => {
    cy.entrarComo('cliente');

    // El cliente abre el formulario desde el botón fijo del panel.
    cy.contains('button', 'Nuevo servicio').click();
    cy.contains('.modal-title', 'Nuevo servicio').should('be.visible');

    cy.idMoto('PRB001').then((idMoto) => {
      cy.get('#historial-agregar-moto').select(String(idMoto));
      cy.get('#historial-agregar-descripcion-problema').type(PROBLEMA);
      cy.contains('button', 'Agregar').click();

      cy.verAviso('Registro Exitoso');

      cy.task('consultaBD', {
        sql: 'SELECT descripcion_prodlema, estado, id_tecnico FROM historial WHERE id_motos = ?',
        valores: [idMoto],
      }).then((filas) => {
        expect(filas, 'el servicio quedó registrado').to.have.length(1);
        expect(filas[0].descripcion_prodlema).to.eq(PROBLEMA);
        // El cliente solo reporta el problema: el servicio nace sin técnico
        // y en estado inicial.
        expect(filas[0].estado).to.eq('En Asignacion');
        expect(filas[0].id_tecnico).to.be.null;
      });
    });
  });

  it('CP-067 — No deja abrir un segundo servicio en una moto que ya tiene uno activo', () => {
    cy.idMoto('PRB001').then((idMoto) => {
      // Primer servicio, creado de partida.
      cy.tokenApi('cliente').then((token) => {
        cy.crearServicio(token, {
          id_motos: idMoto,
          descripcion_prodlema: PROBLEMA,
        });
      });

      // La misma moto, un segundo servicio.
      cy.entrarComo('cliente');
      cy.contains('button', 'Nuevo servicio').click();
      cy.get('#historial-agregar-moto').select(String(idMoto));
      cy.get('#historial-agregar-descripcion-problema').type('Otro problema distinto en la misma moto');
      cy.contains('button', 'Agregar').click();

      cy.verAviso('ya tiene un historial activo');

      cy.task('consultaBD', {
        sql: 'SELECT id_historial FROM historial WHERE id_motos = ?',
        valores: [idMoto],
      }).then((filas) => {
        expect(filas, 'sigue habiendo un solo servicio').to.have.length(1);
      });
    });
  });

  it('CP-068 — Rechaza una descripción vacía o demasiado corta', () => {
    cy.entrarComo('cliente');
    cy.contains('button', 'Nuevo servicio').click();

    cy.idMoto('PRB001').then((idMoto) => {
      cy.get('#historial-agregar-moto').select(String(idMoto));

      // Solo espacios: el sistema lo toma como campo sin diligenciar.
      cy.get('#historial-agregar-descripcion-problema').type('     ');
      cy.contains('button', 'Agregar').click();
      cy.verAviso('faltan datos obligatorio');

      // Descripción demasiado corta.
      cy.get('#historial-agregar-descripcion-problema').clear().type('no prende');
      cy.contains('button', 'Agregar').click();
      cy.verAviso('al menos 10 caracteres');

      cy.task('consultaBD', {
        sql: 'SELECT id_historial FROM historial WHERE id_motos = ?',
        valores: [idMoto],
      }).then((filas) => {
        expect(filas, 'no se registró ningún servicio').to.have.length(0);
      });
    });
  });

  it('CP-069 — Rechaza un adjunto que no es una imagen', () => {
    cy.entrarComo('cliente');
    cy.contains('button', 'Nuevo servicio').click();

    cy.idMoto('PRB001').then((idMoto) => {
      cy.get('#historial-agregar-moto').select(String(idMoto));
      cy.get('#historial-agregar-descripcion-problema').type(PROBLEMA);
      cy.get('#historial-agregar-fotos').selectFile(
        'cypress/fixtures/archivos/documento_no_permitido.txt',
        { force: true }
      );
      cy.contains('button', 'Agregar').click();

      cy.verAviso('Solo se permiten imágenes');

      cy.task('consultaBD', {
        sql: 'SELECT id_historial FROM historial WHERE id_motos = ?',
        valores: [idMoto],
      }).then((filas) => {
        expect(filas, 'no se registró ningún servicio').to.have.length(0);
      });
    });
  });

  it('CP-070 — El recepcionista registra el servicio a nombre del cliente', () => {
    cy.entrarComo('recepcionista');
    cy.irASeccion('Servicio');

    cy.contains('button', 'Agregar Servicio').click();
    cy.contains('.modal-title', 'Agregar Nuevo Servicio').should('be.visible');

    cy.idMoto('PRB002').then((idMoto) => {
      // El recepcionista sí elige de quién es la moto.
      cy.get('#historial-agregar-cliente').select('1900000001');
      cy.get('#historial-agregar-moto').select(String(idMoto));
      cy.get('#historial-agregar-descripcion-problema').type('Cambio de aceite y revisión general de frenos');
      cy.contains('button', 'Agregar').click();

      cy.verAviso('Registro Exitoso');

      cy.task('consultaBD', {
        sql: 'SELECT descripcion_prodlema, estado FROM historial WHERE id_motos = ?',
        valores: [idMoto],
      }).then((filas) => {
        expect(filas, 'el servicio quedó a nombre del cliente dueño de la moto').to.have.length(1);
        expect(filas[0].estado).to.eq('En Asignacion');
      });
    });
  });
});
