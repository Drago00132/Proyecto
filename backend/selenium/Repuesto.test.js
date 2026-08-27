const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const readline = require('readline');

const ADMIN_CORREO = 'martinestaquio1@gmail.com';
const ADMIN_CONTRASENA = '12345678';

const resultados = [];
let tokenAdmin = null;
let idDistribuidorPrueba = null;
const NOMBRE_DISTRIBUIDOR_PRUEBA = `Distribuidor Selenium ${Date.now()}`;

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

async function llamarApi(driver, metodo, url, cuerpo) {
    return driver.executeAsyncScript(
        function (metodo, url, cuerpo, token, callback) {
            fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: cuerpo ? JSON.stringify(cuerpo) : undefined
            })
                .then((res) => res.json().then((data) => ({ status: res.status, data })))
                .then((resultado) => callback(resultado))
                .catch((err) => callback({ error: err.message }));
        },
        metodo,
        url,
        cuerpo,
        tokenAdmin
    );
}

async function crearDistribuidorDePrueba(driver) {
    const resultado = await llamarApi(driver, 'POST', 'http://localhost:3100/api/distribuidores/agregar', {
        nombre_distribuidor: NOMBRE_DISTRIBUIDOR_PRUEBA,
        telefono: '3001234567',
        correo: 'distribuidor.selenium@gmail.com',
        direccion: 'Calle de prueba',
        contacto: 'Prueba Selenium'
    });
    idDistribuidorPrueba = resultado.data?.id_distribuidor;
    if (!idDistribuidorPrueba) {
        throw new Error('No se pudo crear el distribuidor de prueba: ' + JSON.stringify(resultado));
    }
    console.log(`ℹ️  Distribuidor de prueba creado: ${NOMBRE_DISTRIBUIDOR_PRUEBA} (id ${idDistribuidorPrueba})`);
}

async function test1_crearRepuestoVacio(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Repuesto');
        await driver.wait(until.elementLocated(By.id('repuesto-agregar-nombre')), 5000);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Crear repuesto con campos vacíos muestra error', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Crear repuesto con campos vacíos muestra error', false, err.message);
    }
}

async function test2_nombreConNumeros(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Repuesto');
        await driver.wait(until.elementLocated(By.id('repuesto-agregar-nombre')), 5000);

        await driver.findElement(By.id('repuesto-agregar-nombre')).sendKeys('Bujia123');
        await driver.findElement(By.id('repuesto-agregar-cantidad')).sendKeys('10');

        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#repuesto-agregar-distribuidor option'));
            return opciones.length > 1;
        }, 5000);
        const select = new Select(await driver.findElement(By.id('repuesto-agregar-distribuidor')));
        await select.selectByVisibleText(NOMBRE_DISTRIBUIDOR_PRUEBA);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        if (!texto.toLowerCase().includes('número')) {
            throw new Error(`Se esperaba el mensaje sobre números/caracteres especiales, llegó: "${texto}"`);
        }
        registrarResultado('Nombre con números muestra error específico', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Nombre con números muestra error específico', false, err.message);
    }
}

async function test3_crearRepuesto(driver) {
    const nombre = `Bujia Selenium ${Date.now().toString().slice(-6)}`;
    try {
        await clicPorTexto(driver, 'Agregar Repuesto');
        await driver.wait(until.elementLocated(By.id('repuesto-agregar-nombre')), 5000);

        await driver.findElement(By.id('repuesto-agregar-nombre')).sendKeys(nombre);
        await driver.findElement(By.id('repuesto-agregar-cantidad')).sendKeys('15');

        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#repuesto-agregar-distribuidor option'));
            return opciones.length > 1;
        }, 5000);
        const select = new Select(await driver.findElement(By.id('repuesto-agregar-distribuidor')));
        await select.selectByVisibleText(NOMBRE_DISTRIBUIDOR_PRUEBA);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear repuesto válido', true, texto);
        return nombre;
    } catch (err) {
        registrarResultado('Crear repuesto válido', false, err.message);
        return null;
    }
}

async function test4_apareceEnBusqueda(driver, nombre) {
    if (!nombre) {
        registrarResultado('El repuesto aparece en la búsqueda por nombre', false, 'Se saltó: la prueba 3 no creó ningún repuesto');
        return;
    }
    try {
        const campoBusqueda = await driver.findElement(By.css("input[placeholder='Buscar por nombre del repuesto']"));
        await campoBusqueda.sendKeys(nombre);
        await clicPorTexto(driver, 'Buscar');

        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${nombre}']`)), 5000);
        registrarResultado('El repuesto aparece en la búsqueda por nombre (RF-M2.2)', true);
    } catch (err) {
        registrarResultado('El repuesto aparece en la búsqueda por nombre (RF-M2.2)', false, err.message);
    }
}

// Nota: el catch() de este formulario usa un mensaje genérico fijo ("No se pudo completar el
// registro"), no el mensaje específico que ya manda el backend, a diferencia de otros módulos.
// Se documenta aquí en vez de corregirlo, por si prefieres dejarlo así.
async function test5_nombreDuplicado(driver, nombreExistente) {
    if (!nombreExistente) {
        registrarResultado('Nombre duplicado muestra error', false, 'Se saltó: la prueba 3 no creó ningún repuesto');
        return;
    }
    try {
        await driver.get('http://localhost:3000/panel/repuesto');
        await clicPorTexto(driver, 'Agregar Repuesto');
        await driver.wait(until.elementLocated(By.id('repuesto-agregar-nombre')), 5000);

        await driver.findElement(By.id('repuesto-agregar-nombre')).sendKeys(nombreExistente);
        await driver.findElement(By.id('repuesto-agregar-cantidad')).sendKeys('5');
        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#repuesto-agregar-distribuidor option'));
            return opciones.length > 1;
        }, 5000);
        const select = new Select(await driver.findElement(By.id('repuesto-agregar-distribuidor')));
        await select.selectByVisibleText(NOMBRE_DISTRIBUIDOR_PRUEBA);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Nombre duplicado no crea un segundo repuesto', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Nombre duplicado no crea un segundo repuesto', false, err.message);
    }
}

async function test6_editarRepuesto(driver, nombre) {
    if (!nombre) {
        registrarResultado('Editar repuesto', false, 'Se saltó: la prueba 3 no creó ningún repuesto');
        return;
    }
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${nombre}']/parent::tr`));
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoCantidad = await driver.wait(until.elementLocated(By.id('repuesto-editar-cantidad')), 5000);
        await campoCantidad.clear();
        await campoCantidad.sendKeys('40');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar repuesto', true, texto);
    } catch (err) {
        registrarResultado('Editar repuesto', false, err.message);
    }
}

async function test7_eliminarRepuesto(driver, nombre) {
    if (!nombre) {
        registrarResultado('Eliminar repuesto', false, 'Se saltó: la prueba 3 no creó ningún repuesto');
        return;
    }
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${nombre}']/parent::tr`));
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar repuesto', true, texto);
    } catch (err) {
        registrarResultado('Eliminar repuesto', false, err.message);
    }
}

async function limpiarDistribuidorDePrueba(driver) {
    if (!idDistribuidorPrueba) return;
    const resultado = await llamarApi(driver, 'DELETE', `http://localhost:3100/api/distribuidores/eliminar/${idDistribuidorPrueba}`);
    console.log('🧹 Limpieza del distribuidor de prueba:', resultado.data?.message || resultado.error);
}

(async function suiteRepuestos() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await crearDistribuidorDePrueba(driver);

        await driver.get('http://localhost:3000/panel/repuesto');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Repuesto']")), 5000);

        await test1_crearRepuestoVacio(driver);
        await test2_nombreConNumeros(driver);
        const nombre = await test3_crearRepuesto(driver);
        await test4_apareceEnBusqueda(driver, nombre);
        await test5_nombreDuplicado(driver, nombre);
        await test6_editarRepuesto(driver, nombre);
        await test7_eliminarRepuesto(driver, nombre);

        await limpiarDistribuidorDePrueba(driver);

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