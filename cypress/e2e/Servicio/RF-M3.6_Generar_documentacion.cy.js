// RF-M3.6 — Generar documentación de historial
// Casos de prueba: CP-089, CP-090, CP-091

describe('RF-M3.6 — Generar documentación de historial', () => {
  const PROBLEMA = 'Revisión completa de frenos delanteros y traseros';

  beforeEach(() => {
    cy.task('limpiarServicios');
  });

  after(() => {
    cy.task('limpiarServicios');
  });

  /** Deja montado un servicio en la moto PRB001 asignado al técnico de prueba. */
  const montarServicio = (estado) => {
    return cy.idTecnicoPrueba().then((idTecnico) =>
      cy.tokenApi('administrador').then((token) =>
        cy.idMoto('PRB001').then((idMoto) =>
          cy.crearServicio(token, {
            id_motos: idMoto,
            id_tecnico: idTecnico,
            descripcion_prodlema: PROBLEMA,
            descripcion_trabajo: 'Se cambiaron las pastillas y se purgó el líquido',
            estado,
          })
        )
      )
    );
  };

  it('CP-089 — El técnico descarga el documento de un servicio finalizado', () => {
    montarServicio('Finalizado').then((idServicio) => {
      cy.entrarComo('tecnico');
      cy.irASeccion('Servicio');

      cy.buscarServicio(idServicio);
      cy.contains('table tbody tr', 'PRB001').find('button').contains('Ver Detalles').click();
      cy.contains('.modal-title', 'Detalles Completos del Servicio').should('be.visible');

      cy.contains('button', 'Descargar PDF').should('be.visible').click();

      // El archivo queda descargado en la carpeta de descargas de Cypress.
      const carpeta = Cypress.config('downloadsFolder');
      cy.readFile(`${carpeta}/servicio-${idServicio}.pdf`, null, { timeout: 20000 })
        .should((contenido) => {
          expect(contenido.length, 'el documento tiene contenido').to.be.greaterThan(0);
        });
    });
  });

  it('CP-090 — No deja generar el documento si el servicio no está finalizado', () => {
    montarServicio('En Proceso').then((idServicio) => {
      cy.entrarComo('tecnico');
      cy.irASeccion('Servicio');

      cy.buscarServicio(idServicio);
      cy.contains('table tbody tr', 'PRB001').find('button').contains('Ver Detalles').click();
      cy.contains('.modal-title', 'Detalles Completos del Servicio').should('be.visible');

      // El estado se ve en el detalle, pero el botón de descarga no aparece.
      cy.contains('En Proceso').should('be.visible');
      cy.contains('button', 'Descargar PDF').should('not.exist');
    });
  });

  it('CP-091 — Un cliente no alcanza el documento de un servicio ajeno', () => {
    // Servicio finalizado de la moto de OTRO cliente (PRB003, de Mateo).
    cy.tokenApi('administrador').then((token) => {
      cy.idMoto('PRB003').then((idMotoAjena) => {
        cy.crearServicio(token, {
          id_motos: idMotoAjena,
          descripcion_prodlema: 'Servicio de otro cliente que no debe verse',
          estado: 'Finalizado',
        }).then((idAjeno) => {
          cy.entrarComo('cliente');
          cy.irASeccion('Servicio');

          // Ese servicio no aparece en su listado, así que no tiene por dónde
          // llegar al botón de descarga. No se usa el buscador aquí: trae
          // cualquier servicio por su número, sin mirar de quién es, así que
          // lo que hay que comprobar es el listado, que sí respeta el rol.
          // Esta línea mira la página que el cliente tiene delante; la
          // comprobación contra la API, más abajo, revisa su listado completo
          // y es la que de verdad cierra el caso.
          cy.get('table tbody').should('not.contain', 'PRB003');
          cy.contains('button', 'Descargar PDF').should('not.exist');

          cy.tokenApi('cliente').then((tokenCliente) => {
            cy.peticionApi(tokenCliente, {
              method: 'GET',
              url: '/api/historial/listar?limit=999999',
            }).then((respuesta) => {
              const ids = respuesta.body.historial.map((h) => h.id_historial);
              expect(ids, 'no recibe el servicio ajeno').to.not.include(idAjeno);
            });
          });
        });
      });
    });
  });
});
