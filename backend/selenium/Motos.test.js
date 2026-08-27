const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');

const ADMIN_CORREO = 'martinestaquio1@gmail.com';
const ADMIN_CONTRASENA = '12345678';

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

async function filaDeMoto(driver, placa) {
    return driver.findElement(By.xpath(`//td[normalize-space(text())='${placa}']/parent::tr`));
}

async function test1_columnasVisiblesParaAdmin(driver) {
    try {
        const encabezados = await driver.findElements(By.css('table thead th'));
        const textos = await Promise.all(encabezados.map((e) => e.getText()));

        const tieneColumnasAdmin = textos.some((t) => t.toLowerCase().includes('numero de identidad'));
        if (!tieneColumnasAdmin) {
            throw new Error(`No se ven las columnas exclusivas de Administrador. Encabezados encontrados: ${textos.join(', ')}`);
        }
        registrarResultado('Administrador ve las columnas de detalle (Id/Identidad/Nombre)', true);
    } catch (err) {
        registrarResultado('Administrador ve las columnas de detalle (Id/Identidad/Nombre)', false, err.message);
    }
}

async function test2_crearMotoVacia(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Motos');
        await driver.wait(until.elementLocated(By.id('moto-agregar-marca')), 5000);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Crear moto con campos vacíos muestra error', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Crear moto con campos vacíos muestra error', false, err.message);
    }
}

async function test3_crearMoto(driver) {
    const placa = `SEL${Date.now().toString().slice(-6)}`;
    try {
        await clicPorTexto(driver, 'Agregar Motos');
        await driver.wait(until.elementLocated(By.id('moto-agregar-identidad')), 5000);

        // Espera a que el select de clientes cargue al menos una opción real.
        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#moto-agregar-identidad option'));
            return opciones.length > 1;
        }, 5000);

        const selectCliente = new Select(await driver.findElement(By.id('moto-agregar-identidad')));
        await selectCliente.selectByIndex(1); 

        await driver.findElement(By.id('moto-agregar-marca')).sendKeys('Yamaha');
        await driver.findElement(By.id('moto-agregar-modelo')).sendKeys('FZ Selenium');
        await driver.findElement(By.id('moto-agregar-placa')).sendKeys(placa);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear moto válida', true, texto);
        return placa;
    } catch (err) {
        registrarResultado('Crear moto válida', false, err.message);
        return null;
    }
}

// --- Prueba 4: la moto creada aparece en la lista ---
async function test4_motoApareceEnLista(driver, placa) {
    if (!placa) {
        registrarResultado('La moto creada aparece en la lista', false, 'Se saltó: la prueba 3 no creó ninguna moto');
        return;
    }
    try {
        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${placa}']`)), 5000);
        registrarResultado('La moto creada aparece en la lista', true);
    } catch (err) {
        registrarResultado('La moto creada aparece en la lista', false, err.message);
    }
}

// --- Prueba 5: no se puede crear otra moto con la misma placa ---
async function test5_placaDuplicada(driver, placaExistente) {
    if (!placaExistente) {
        registrarResultado('Placa duplicada muestra error', false, 'Se saltó: la prueba 3 no creó ninguna moto');
        return;
    }
    try {
        await clicPorTexto(driver, 'Agregar Motos');
        await driver.wait(until.elementLocated(By.id('moto-agregar-identidad')), 5000);
        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#moto-agregar-identidad option'));
            return opciones.length > 1;
        }, 5000);

        const selectCliente = new Select(await driver.findElement(By.id('moto-agregar-identidad')));
        await selectCliente.selectByIndex(1);

        await driver.findElement(By.id('moto-agregar-marca')).sendKeys('Honda');
        await driver.findElement(By.id('moto-agregar-modelo')).sendKeys('CB1 Duplicada');
        await driver.findElement(By.id('moto-agregar-placa')).sendKeys(placaExistente);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Placa duplicada muestra error (no crea la segunda moto)', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Placa duplicada muestra error (no crea la segunda moto)', false, err.message);
    }
}

// --- Prueba 6: editar la moto creada ---
async function test6_editarMoto(driver, placa) {
    if (!placa) {
        registrarResultado('Editar moto', false, 'Se saltó: la prueba 3 no creó ninguna moto');
        return;
    }
    try {
        const fila = await filaDeMoto(driver, placa);
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoModelo = await driver.wait(until.elementLocated(By.id('moto-editar-modelo')), 5000);
        await campoModelo.clear();
        await campoModelo.sendKeys('FZ Editada Selenium');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar moto', true, texto);
    } catch (err) {
        registrarResultado('Editar moto', false, err.message);
    }
}

// --- Prueba 7: eliminar la moto creada ---
async function test7_eliminarMoto(driver, placa) {
    if (!placa) {
        registrarResultado('Eliminar moto', false, 'Se saltó: la prueba 3 no creó ninguna moto');
        return;
    }
    try {
        const fila = await filaDeMoto(driver, placa);
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar moto', true, texto);
    } catch (err) {
        registrarResultado('Eliminar moto', false, err.message);
    }
}

(async function suiteMotos() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await driver.get('http://localhost:3000/panel/motos');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Motos']")), 5000);

        await test1_columnasVisiblesParaAdmin(driver);
        await test2_crearMotoVacia(driver);
        const placa = await test3_crearMoto(driver);
        await test4_motoApareceEnLista(driver, placa);
        await test5_placaDuplicada(driver, placa);
        await test6_editarMoto(driver, placa);
        await test7_eliminarMoto(driver, placa);

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