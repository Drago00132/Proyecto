describe('Prueba E2E de Atenticacion - Sistema de motos',() =>{
    it('Debe iniciar sesion correctamente y llegar al panel',()=>{
        cy.visit('http://localhost:3000/');

        cy.get("input[id='login-usuario']").type('2');
        cy.get("input[id='login-contrasena']").type('2');

        cy.get('button').contains('Iniciar sesión').click();

        cy.url().should('include','/panel');

        cy.log('prueba de E2E ejecutando exitosamente');
    });
});