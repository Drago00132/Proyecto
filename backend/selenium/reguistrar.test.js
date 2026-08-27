const { Builder, By, until } =require('selenium-webdriver');
const {Select} = require('selenium-webdriver/lib/select');

(async function testReguistrar() {
    let driver = await new Builder().forBrowser('chrome').build();    
    
    try{
        await driver.manage().window().maximize();
        await driver.get('http://localhost:3000/Registarse');
        const selectElement = await driver.findElement(By.id('registro-tipo-documento'));
        const select = new Select(selectElement);
        await driver.wait(until.elementLocated(By.id('registro-identidad')), 5000);
        await driver.findElement(By.id('registro-identidad')).sendKeys('1032489567');
        await select.selectByVisibleText('Cedula de Ciudadania');
        await driver.findElement(By.id('registro-nombre')).sendKeys('marcos');
        await driver.findElement(By.id('registro-apellido')).sendKeys('gaviria');
        await driver.findElement(By.id('registro-fecha-nacimiento')).sendKeys('10/12/2000');
        await driver.findElement(By.id('registro-celular')).sendKeys('3002797538');
        await driver.findElement(By.id('registro-email')).sendKeys('Marcos145@gmail.com');
        await driver.findElement(By.id('registro-contrasena')).sendKeys('marcos123');
        const botonRegistrar = await driver.findElement(By.css('button[Type="submit"]'));
        await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', botonRegistrar);
        await driver.executeScript('arguments[0].click();', botonRegistrar);
        await driver.wait(until.urlContains('panel'), 5000);
        console.log('Login ok');
    } catch (err){
        console.error('fallo login:', err.message);
        console.log('URL actual:', await driver.getCurrentUrl());
        process.exitCode = 1; 
    } finally {
        await driver.quit();
    }
})();