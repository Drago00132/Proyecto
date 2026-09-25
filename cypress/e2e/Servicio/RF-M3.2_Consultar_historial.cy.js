// RF-M3.2 — Consultar historial
// Casos de prueba: CP-071, CP-072, CP-073, CP-074, CP-075

describe('RF-M3.2 — Consultar historial', () => {
  const PROBLEMA_ASIGNADO = 'Ruido en la transmisión al cambiar de marcha';
  const PROBLEMA_SIN_ASIGNAR = 'Se descarga la batería de un día para otro';

  let idAsignado = null;   // servicio con técnico de prueba asignado (moto PRB001)
  let idSinAsignar = null; // servicio sin técnico (moto PRB002)

  beforeEach(() => {
    cy.task('limpiarServicios');

    // Dos servicios del mismo cliente: uno asignado al técnico de prueba y
    // otro sin técnico. Sirven para comprobar qué ve cada rol.
    cy.tokenApi('administrador').then((token) => {
      cy.idMoto('PRB001').then((idMoto1) => {
        cy.idTecnicoPrueba().then((idTecnico) => {
          cy.crearServicio(token, {
            id_motos: idMoto1,
            id_tecnico: idTecnico,
            descripcion_prodlema: PROBLEMA_ASIGNADO,
            estado: 'En Proceso',
          }).then((id) => { idAsignado = id; });
        });
      });

      cy.idMoto('PRB002').then((idMoto2) => {
        cy.crearServicio(token, {
          id_motos: idMoto2,
          descripcion_prodlema: PROBLEMA_SIN_ASIGNAR,
        }).then((id) => { idSinAsignar = id; });
      });
    });
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  it('CP-071 — El cliente consulta el detalle de su servicio', () => {
    cy.entrarComo('cliente');
    cy.irASeccion('Servicio');

    cy.contains('table tbody tr', 'PRB001').find('button').contains('Ver Detalles').click();

    cy.contains('.modal-title', 'Detalles Completos del Servicio').should('be.visible');
    cy.contains('Problema:').should('be.visible');
    cy.contains(PROBLEMA_ASIGNADO).should('be.visible');
    cy.contains('Fecha Inicio:').should('be.visible');
  });

  it('CP-072 — El técnico solo ve los servicios que tiene asignados', () => {
    cy.entrarComo('tecnico');
    cy.irASeccion('Servicio');

    // Ve el que le asignaron.
    cy.contains('table tbody tr', 'PRB001').should('exist');
    // Y no el que no tiene técnico.
    cy.contains('table tbody tr', 'PRB002').should('not.exist');

    cy.tokenApi('tecnico').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/historial/listar?limit=999999' })
        .then((respuesta) => {
          const ids = respuesta.body.historial.map((h) => h.id_historial);
          expect(ids).to.include(idAsignado);
          expect(ids, 'no recibe los servicios ajenos').to.not.include(idSinAsignar);
        });
    });
  });

  it('CP-073 — El recepcionista ve todos los servicios', () => {
    cy.tokenApi('recepcionista').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/historial/listar?limit=999999' })
        .then((respuesta) => {
          const ids = respuesta.body.historial.map((h) => h.id_historial);
          expect(ids).to.include(idAsignado);
          expect(ids).to.include(idSinAsignar);
        });
    });

    cy.entrarComo('recepcionista');
    cy.irASeccion('Servicio');
    cy.contains('table tbody tr', 'PRB001').should('exist');
    cy.contains('table tbody tr', 'PRB002').should('exist');
  });

  it('CP-074 — El administrador ve todos los servicios', () => {
    cy.tokenApi('administrador').then((token) => {
      cy.peticionApi(token, { method: 'GET', url: '/api/historial/listar?limit=999999' })
        .then((respuesta) => {
          const ids = respuesta.body.historial.map((h) => h.id_historial);
          expect(ids).to.include(idAsignado);
          expect(ids).to.include(idSinAsignar);
        });
    });

    cy.entrarComo('administrador');
    cy.irASeccion('Servicio');
    cy.contains('table tbody tr', 'PRB001').should('exist');
    cy.contains('table tbody tr', 'PRB002').should('exist');
  });

  it('CP-075 — El filtro por número de registro trae solo ese servicio', () => {
    cy.entrarComo('administrador');
    cy.irASeccion('Servicio');

    cy.get('input[placeholder*="Buscar"]').clear().type(String(idAsignado));
    cy.contains('button', 'Buscar').click();

    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('table tbody tr', 'PRB001').should('exist');
    cy.contains('table tbody tr', 'PRB002').should('not.exist');

    // El botón "resetear" devuelve el listado completo.
    cy.contains('button', 'resetear').click();
    cy.contains('table tbody tr', 'PRB002').should('exist');
  });
});
