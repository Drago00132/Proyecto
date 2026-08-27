describe('Prueba E2E de Atenticacion - Sistema de motos',() =>{
    
    it('Debe iniciar sesion correctamente y llegar al panel',()=>{
        cy.visit('http://localhost:3000/Registarse');

        cy.get("input[id='registro-identidad']").type('2');
        cy.get("select[id='registro-tipo-documento']").select('Cedula de Ciudadania');

        cy.get('button').contains('Registrarse').click();

        cy.url().should('include','/panel');

        cy.log('prueba de E2E ejecutando exitosamente');
    });
});