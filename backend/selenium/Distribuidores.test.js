const { Builder, By, until } = require('selenium-webdriver');
const readline = require('readline');

const SUPER_ADMIN_CORREO = 'martinestaquio1@gmail.com';
const SUPER_ADMIN_CONTRASENA = '12345678';

const resultados = [];

function registrarResultado(nombre, ok, detalle) {
    resultados.push({ nombre, ok, detalle });
    console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
}

async function clicJS(driver, elemento) {
    await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', elemento);
    await driver.executeScript('arguments[0].click();', elemento);
}

async function clicPorTexto(driver, texto) {
    const boton = await driver.findElement(By.xpath(`//button[normalize-space(text())='${texto}']`));
    await clicJS(driver, boton);
    return boton;
}

async function esperarToast(driver, tipo = 'success') {
    const toast = await driver.wait(until.elementLocated(By.css(`.Toastify__toast--${tipo}`)), 5000);
    return toast.getText();
}

function preguntarEnConsola(pregunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolve(respuesta.trim());
        });
    });
}

async function login(driver, correo, contrasena) {
    await driver.get('http://localhost:3000/');
    await driver.wait(until.elementLocated(By.id('login-usuario')), 5000);
    await driver.findElement(By.id('login-usuario')).sendKeys(correo);
    await driver.findElement(By.id('login-contrasena')).sendKeys(contrasena);
    const boton = await driver.findElement(By.css('button[Type="submit"]'));
    await clicJS(driver, boton);

    console.log(`⏳ Esperando respuesta del login para ${correo} (puede tardar hasta 1 minuto si tiene 2FA, por el envío del correo)...`);

    const resultado = await Promise.race([
        driver.wait(until.urlContains('panel'), 90000).then(() => 'panel').catch(() => null),
        driver.wait(until.elementLocated(By.id('login-codigo-2fa')), 90000).then(() => 'codigo').catch(() => null)
    ]);
 
    if (resultado === 'codigo') {
        console.log(`\n🔐 Esta cuenta (${correo}) tiene 2FA activado.`);
        const codigo = await preguntarEnConsola('   Revisa tu correo y escribe aquí el código de 6 dígitos: ');
 
        await driver.findElement(By.id('login-codigo-2fa')).sendKeys(codigo);
        const botonVerificar = await driver.findElement(By.xpath("//button[normalize-space(text())='Verificar código']"));
        await clicJS(driver, botonVerificar);
 
        await driver.wait(until.urlContains('panel'), 8000);
    } else if (resultado !== 'panel') {
        throw new Error('El login no llegó a /panel ni mostró el paso de 2FA; revisa si las credenciales son correctas');
    }
}

async function filaDeDistribuidores(driver, nombreDistribuidores) {
    return driver.findElement(By.xpath(`//td[normalize-space(text())='${nombreDistribuidores}']/parent::tr`));
}

async function test1_crearDistribuidor(driver) {
    const nombreDistribuidor = `Motozone${Date.now().toString().slice(-6)}`;
    const telefonoDistribuidor = `3007592867${Date.now().toString().slice(-6)}`;
    const correoDistribuidor = `Motozone@gmail.com${Date.now().toString().slice(-6)}`;
    const DireccionDistribuidor = `car 11 calle 26${Date.now().toString().slice(-6)}`;
    const contactoDistribuidor = `administrador${Date.now().toString().slice(-6)}`;
    try {
        await clicPorTexto(driver, 'Agregar Distribuidor');
        await driver.wait(until.elementLocated(By.id('distribuidor-agregar-nombre')), 5000);
        await driver.findElement(By.id('distribuidor-agregar-nombre')).sendKeys(nombreDistribuidor);
        await driver.findElement(By.id('distribuidor-agregar-telefono')).sendKeys(telefonoDistribuidor);
        await driver.findElement(By.id('distribuidor-agregar-correo')).sendKeys(correoDistribuidor);
        await driver.findElement(By.id('distribuidor-agregar-Direccion')).sendKeys(DireccionDistribuidor);
        await driver.findElement(By.id('distribuidor-agregar-contacto')).sendKeys(contactoDistribuidor);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear Distribuidor nuevo', true, texto);
        return { nombreDistribuidor, telefonoDistribuidor, correoDistribuidor, DireccionDistribuidor, contactoDistribuidor };
    } catch (err) {
        registrarResultado('Crear Distribuidor nuevo', false, err.message);
        return null;
    }
}

async function test2_DistribuidorApareceEnLista(driver, nombreDistribuidor) {
    if (!nombreDistribuidor) {
        registrarResultado('El Distribuidor creado aparece en la lista', false, 'Se saltó: la prueba 2 no creó ningún Distribuidor');
        return;
    }
    try {
        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${nombreDistribuidor}']`)), 5000);
        registrarResultado('El Distribuidor creado aparece en la lista', true);
    } catch (err) {
        registrarResultado('El Distribuidor creado aparece en la lista', false, err.message);
    }
}

async function test3_editarDistribuidor(driver, nombreDistribuidor) {
    if (!nombreDistribuidor) {
        registrarResultado('Editar Distribuidor', false, 'Se saltó: la prueba 2 no creó ningún Distribuidor');
        return null;
    }
    const nombreEditado = `${nombreDistribuidor}Editado`;
    try {
        const fila = await filaDeDistribuidores(driver, nombreDistribuidor);
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const camponombre = await driver.wait(until.elementLocated(By.id('distribuidor-editar-nombre')), 5000);
        await camponombre.clear();
        await camponombre.sendKeys(nombreEditado);

        const campotelefono = await driver.wait(until.elementLocated(By.id('distribuidor-editar-telefono')), 5000);
        await campotelefono.clear();
        await campotelefono.sendKeys('30075928679');

        const campocorreo = await driver.wait(until.elementLocated(By.id('distribuidor-editar-correo')), 5000);
        await campocorreo.clear();
        await campocorreo.sendKeys('motozone@gmail.com');

        const campodireccion = await driver.wait(until.elementLocated(By.id('distribuidor-editar-direccion')), 5000);
        await campodireccion.clear();
        await campodireccion.sendKeys('carrera 11 calle 26');

        const campocontacto = await driver.wait(until.elementLocated(By.id('distribuidor-editar-contacto')), 5000);
        await campocontacto.clear();
        await campocontacto.sendKeys('suvervisor');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar distribuidor', true, texto);
        return nombreEditado;
    } catch (err) {
        registrarResultado('Editar distribuidor', false, err.message);
        return nombreDistribuidor; 
    }
}

async function test4_eliminardistribuidorcreado(driver, nombreDistribuidor) {
    if (!nombreDistribuidor) {
        registrarResultado('Eliminar el distribuidor creado', false, 'Se saltó: no hay distribuidor creado para eliminar');
        return;
    }
    try {
        const fila = await filaDeDistribuidores(driver, nombreDistribuidor);
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='Eliminar']")), 5000);
        await clicPorTexto(driver, 'Eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar el distribuidor creado (sin restricciones)', true, texto);
    } catch (err) {
        registrarResultado('Eliminar el distribuidor creado (sin restricciones)', false, err.message);
    }
}

(async function suitedistribuidor() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, SUPER_ADMIN_CORREO, SUPER_ADMIN_CONTRASENA);
        await driver.get('http://localhost:3000/panel/distribuidores');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Distribuidor']")), 5000);

        const datosDistribuidor = await test1_crearDistribuidor(driver); // ahora es un objeto, no un texto
        await test2_DistribuidorApareceEnLista(driver, datosDistribuidor?.nombreDistribuidor);
        const nombreFinal = await test3_editarDistribuidor(driver, datosDistribuidor?.nombreDistribuidor);
        await test4_eliminardistribuidorcreado(driver, nombreFinal);

        console.log('\n--- Resumen ---');
        const exitosas = resultados.filter((r) => r.ok).length;
        console.log(`${exitosas} de ${resultados.length} pruebas pasaron`);

        if (exitosas < resultados.length) {
            process.exitCode = 1;
        }
    } catch (err) {
        console.error('Error inesperado en la suite:', err.message);
        process.exitCode = 1;
    } finally {
        await driver.quit();
    }
})();