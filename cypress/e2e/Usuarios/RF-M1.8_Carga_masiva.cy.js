// RF-M1.8 — Carga masiva de usuarios
// Casos de prueba: CP-030, CP-031, CP-032, CP-033

describe('RF-M1.8 — Carga masiva de usuarios', () => {
  const DESECHABLES = ['1900000810', '1900000811', '1900000812', '1900000813'];

  const limpiar = () => {
    DESECHABLES.forEach((identidad) => cy.task('borrarUsuario', identidad));
  };

  beforeEach(() => {
    limpiar();
  });

  after(() => {
    limpiar();
  });

  /** Abre la ventana de carga masiva desde la pantalla de Técnicos. */
  const abrirCargaMasiva = () => {
    cy.entrarComo('administrador');
    cy.irASeccion('tecnico');
    cy.contains('button', 'subir Tecnico').click();
    cy.contains('.modal-title', 'Agregar Nuevo Tecnico').should('be.visible');
  };

  it('CP-030 — El administrador carga un archivo válido y se crean los técnicos', () => {
    abrirCargaMasiva();

    cy.get('input[type=file]').selectFile(
      'cypress/fixtures/archivos/tecnicos_validos.xlsx',
      { force: true }
    );
    cy.contains('button', 'Subir Técnicos').click();

    cy.verAviso('Carga masiva');

    // Los dos técnicos del archivo quedan registrados con rol Técnico (2).
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad, id_rol FROM usuarios WHERE numero_identidad IN (?, ?)',
      valores: ['1900000810', '1900000811'],
    }).then((filas) => {
      expect(filas).to.have.length(2);
      filas.forEach((f) => expect(Number(f.id_rol)).to.eq(2));
    });

    // Y el sistema les abre su ficha de técnico automáticamente.
    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM tecnico WHERE numero_identidad IN (?, ?)',
      valores: ['1900000810', '1900000811'],
    }).then((filas) => {
      expect(filas, 'ficha de técnico creada para cada uno').to.have.length(2);
    });
  });

  it('CP-031 — Sin archivo seleccionado no deja continuar', () => {
    abrirCargaMasiva();

    cy.contains('Seleccionar archivo Excel').should('be.visible');
    cy.contains('button', 'Subir Técnicos').should('be.disabled');
  });

  it('CP-032 — Una fila con datos inválidos detiene la carga y no crea el usuario', () => {
    abrirCargaMasiva();

    cy.get('input[type=file]').selectFile(
      'cypress/fixtures/archivos/tecnicos_fila_invalida.xlsx',
      { force: true }
    );
    cy.contains('button', 'Subir Técnicos').click();

    cy.verAviso('No se pudo procesar la carga masiva');

    cy.task('consultaBD', {
      sql: 'SELECT numero_identidad FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000812'],
    }).then((filas) => {
      expect(filas, 'la fila inválida no se guardó').to.have.length(0);
    });
  });

  it('CP-033 — Una fila que pide un rol no permitido no crea un administrador', () => {
    abrirCargaMasiva();

    cy.get('input[type=file]').selectFile(
      'cypress/fixtures/archivos/tecnicos_rol_no_permitido.xlsx',
      { force: true }
    );
    cy.contains('button', 'Subir Técnicos').click();

    cy.verAviso('Carga masiva');

    // Esta vía solo crea técnicos: el rol Administrador que traía el archivo
    // se ignora y el usuario queda como Técnico.
    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM usuarios WHERE numero_identidad = ?',
      valores: ['1900000813'],
    }).then((filas) => {
      expect(filas).to.have.length(1);
      expect(Number(filas[0].id_rol), 'no se creó ningún administrador').to.eq(2);
    });
  });
});
