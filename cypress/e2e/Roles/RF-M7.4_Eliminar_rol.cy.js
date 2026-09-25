// RF-M7.4 — Eliminar rol
// Casos de prueba: CP-086, CP-087, CP-088
//
// Nota: estos tres códigos también existen en RF-M3.5 (la numeración vuelve a
// empezar en el módulo 5), por eso se marcan con "(M7)".

describe('RF-M7.4 — Eliminar rol', () => {
  const DESECHABLE = 'Auxiliar CP086';
  const IDENTIDAD_DESECHABLE = '1900000830';
  let idRol = null;

  const limpiar = () => {
    cy.task('borrarUsuario', IDENTIDAD_DESECHABLE);
    cy.task('borrarRol', DESECHABLE);
  };

  beforeEach(() => {
    limpiar();
    cy.tokenApi('superadministrador').then((token) => {
      cy.peticionApi(token, {
        method: 'POST',
        url: '/api/roles/agregar',
        body: { rol: DESECHABLE },
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(201);
        idRol = respuesta.body.id_rol;
      });
    });
  });

  after(() => limpiar());

  it('CP-086 (M7) — El súper administrador elimina un rol', () => {
    cy.entrarComo('superadministrador');
    cy.irASeccion('roles');

    // El listado viene paginado, así que se ubica el rol por su identificador.
    cy.get('input[placeholder*="Buscar"]').clear().type(String(idRol));
    cy.contains('button', 'Buscar').click();

    cy.contains('table tbody tr', DESECHABLE).find('button').contains('Eliminar').click();
    cy.contains('seguro que quieres eliminar este Rol').should('be.visible');
    cy.contains('button', 'eliminar').click();

    cy.verAviso('Rol eliminado');

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM roles WHERE id_rol = ?',
      valores: [idRol],
    }).then((filas) => {
      expect(filas, 'el rol ya no existe').to.have.length(0);
    });
  });

  it('CP-087 (M7) — No deja eliminar uno de los roles base del sistema', () => {
    cy.entrarComo('superadministrador');
    cy.irASeccion('roles');

    // El rol Cliente (3) es uno de los cinco con los que funciona el sistema.
    cy.get('input[placeholder*="Buscar"]').clear().type('3');
    cy.contains('button', 'Buscar').click();

    cy.get('table tbody tr').first().find('button').contains('Eliminar').click();
    cy.contains('button', 'eliminar').click();

    // En pantalla el aviso es el genérico de la acción.
    cy.verAviso('el Rol no fue eliminado');

    // El motivo concreto lo da el servidor.
    cy.tokenApi('superadministrador').then((token) => {
      cy.peticionApi(token, { method: 'DELETE', url: '/api/roles/eliminar/3' })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(409);
          expect(respuesta.body.message).to.contain('rol base');
        });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM roles WHERE id_rol = 3',
      valores: [],
    }).then((filas) => {
      expect(filas, 'el rol base sigue existiendo').to.have.length(1);
    });
  });

  it('CP-088 (M7) — No deja eliminar un rol que tiene usuarios asignados', () => {
    // Se crea un usuario desechable y se le pone el rol nuevo.
    cy.tokenApi('superadministrador').then((token) => {
      cy.datosUsuario(IDENTIDAD_DESECHABLE, 3, 'cp088.pruebas').then((datos) => {
        cy.peticionApi(token, { method: 'POST', url: '/api/usuarios/agregar', body: datos })
          .its('status').should('eq', 201);
      });

      cy.task('ejecutarBD', {
        sql: 'UPDATE usuarios SET id_rol = ? WHERE numero_identidad = ?',
        valores: [idRol, IDENTIDAD_DESECHABLE],
      });

      cy.peticionApi(token, { method: 'DELETE', url: `/api/roles/eliminar/${idRol}` })
        .then((respuesta) => {
          expect(respuesta.status).to.eq(409);
          expect(respuesta.body.message).to.contain('usuario(s) asignado(s)');
        });
    });

    cy.task('consultaBD', {
      sql: 'SELECT id_rol FROM roles WHERE id_rol = ?',
      valores: [idRol],
    }).then((filas) => {
      expect(filas, 'el rol sigue existiendo').to.have.length(1);
    });
  });
});
