const { Builder, By, until } =require('selenium-webdriver');

(async function testLogin() {
    let driver = await new Builder().forBrowser('chrome').build();
    try{
        await driver.get('http://localhost:3000/');
        await driver.wait(until.elementLocated(By.id('login-usuario')), 500);
        await driver.findElement(By.id('login-usuario')).sendKeys('2');
        await driver.findElement(By.id('login-contrasena')).sendKeys('2');
        await driver.findElement(By.css('button[Type="submit"]')).click();
        await driver.wait(until.urlContains('panel'), 5000);
        console.log('Login ok');
    } catch (err){
        console.error('fallo login:', err.message);
        process.exitCode = 1; 
    } finally {
        await driver.quit();
    }
})();