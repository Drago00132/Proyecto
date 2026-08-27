const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const readline = require('readline');

const ADMIN_CORREO = 'martinestaquio1@gmail.com';
const ADMIN_CONTRASENA = '12345678';

const resultados = [];
let tokenAdmin = null;
let idDistribuidorPrueba = null;
let idRepuestoPrueba = null;
const NOMBRE_DISTRIBUIDOR_PRUEBA = `Distribuidor Selenium ${Date.now()}`;
const NOMBRE_REPUESTO_PRUEBA = `Repuesto Selenium ${Date.now().toString().slice(-6)}`;

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

async function prepararDatosDePrueba(driver) {
    const resultadoDistribuidor = await llamarApi(driver, 'POST', 'http://localhost:3100/api/distribuidores/agregar', {
        nombre_distribuidor: NOMBRE_DISTRIBUIDOR_PRUEBA,
        telefono: '3001234567',
        correo: 'distribuidor.selenium@gmail.com',
        direccion: 'Calle de prueba',
        contacto: 'Prueba Selenium'
    });
    idDistribuidorPrueba = resultadoDistribuidor.data?.id_distribuidor;
    if (!idDistribuidorPrueba) throw new Error('No se pudo crear el distribuidor de prueba: ' + JSON.stringify(resultadoDistribuidor));

    const resultadoRepuesto = await llamarApi(driver, 'POST', 'http://localhost:3100/api/repuestos/agregar', {
        nombre_repuesto: NOMBRE_REPUESTO_PRUEBA,
        cantidad: 10
    });
    idRepuestoPrueba = resultadoRepuesto.data?.id_repuestos;
    if (!idRepuestoPrueba) throw new Error('No se pudo crear el repuesto de prueba: ' + JSON.stringify(resultadoRepuesto));

    console.log(`ℹ️  Distribuidor de prueba: ${NOMBRE_DISTRIBUIDOR_PRUEBA} (id ${idDistribuidorPrueba})`);
    console.log(`ℹ️  Repuesto de prueba: ${NOMBRE_REPUESTO_PRUEBA} (id ${idRepuestoPrueba})`);
}

async function seleccionarRepuestoYDistribuidor(driver, prefijoId) {
    await driver.wait(async () => {
        const opciones = await driver.findElements(By.css(`#${prefijoId}-repuesto option`));
        return opciones.length > 1;
    }, 5000);
    const selectRepuesto = new Select(await driver.findElement(By.id(`${prefijoId}-repuesto`)));
    await selectRepuesto.selectByVisibleText(NOMBRE_REPUESTO_PRUEBA);

    const selectDistribuidor = new Select(await driver.findElement(By.id(`${prefijoId}-distribuidor`)));
    await selectDistribuidor.selectByVisibleText(NOMBRE_DISTRIBUIDOR_PRUEBA);
}

async function test1_crearEntradaVacia(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Entrada');
        await driver.wait(until.elementLocated(By.id('entrada-agregar-fecha')), 5000);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Crear entrada con campos vacíos muestra error', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Crear entrada con campos vacíos muestra error', false, err.message);
    }
}

// Nota: a diferencia de mandar el número 0 directo por la API (que cae en el mensaje
// genérico de "campos obligatorios" por el bug de "0 es falsy" en JS), desde el
// formulario real el valor siempre llega como texto ("0"), así que debería mostrar
// el mensaje específico "debe ser mayor a 0". Esta prueba confirma cuál de los dos
// casos ocurre en la práctica.
async function test2_cantidadCero(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Entrada');
        await driver.wait(until.elementLocated(By.id('entrada-agregar-fecha')), 5000);

        const hoy = new Date().toISOString().slice(0, 10);
        await driver.findElement(By.id('entrada-agregar-fecha')).sendKeys(hoy);
        await driver.findElement(By.id('entrada-agregar-cantidad')).sendKeys('0');
        await seleccionarRepuestoYDistribuidor(driver, 'entrada-agregar');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Cantidad = 0 muestra un mensaje de error', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Cantidad = 0 muestra un mensaje de error', false, err.message);
    }
}

async function test3_crearEntrada(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Entrada');
        await driver.wait(until.elementLocated(By.id('entrada-agregar-fecha')), 5000);

        const hoy = new Date().toISOString().slice(0, 10);
        await driver.findElement(By.id('entrada-agregar-fecha')).sendKeys(hoy);
        await driver.findElement(By.id('entrada-agregar-cantidad')).sendKeys('25');
        await seleccionarRepuestoYDistribuidor(driver, 'entrada-agregar');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear entrada válida', true, texto);
    } catch (err) {
        registrarResultado('Crear entrada válida', false, err.message);
    }
}

async function test4_apareceEnLista(driver) {
    try {
        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${NOMBRE_REPUESTO_PRUEBA}']`)), 5000);
        registrarResultado('La entrada creada aparece en la lista', true);
    } catch (err) {
        registrarResultado('La entrada creada aparece en la lista', false, err.message);
    }
}

async function test5_editarEntrada(driver) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${NOMBRE_REPUESTO_PRUEBA}']/parent::tr`));
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoRegistradoPor = await driver.wait(until.elementLocated(By.id('entrada-editar-registrado-por')), 5000);
        const esDisabled = await campoRegistradoPor.getAttribute('disabled');
        if (!esDisabled) {
            throw new Error('El campo "Registrado por" no está deshabilitado; se podría alterar quién registró la entrada');
        }

        const campoCantidad = await driver.findElement(By.id('entrada-editar-cantidad'));
        await campoCantidad.clear();
        await campoCantidad.sendKeys('30');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar entrada ("Registrado por" es de solo lectura)', true, texto);
    } catch (err) {
        registrarResultado('Editar entrada ("Registrado por" es de solo lectura)', false, err.message);
    }
}

async function test6_eliminarEntrada(driver) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${NOMBRE_REPUESTO_PRUEBA}']/parent::tr`));
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar entrada', true, texto);
    } catch (err) {
        registrarResultado('Eliminar entrada', false, err.message);
    }
}

async function limpiarDatosDePrueba(driver) {
    if (idRepuestoPrueba) {
        const r = await llamarApi(driver, 'DELETE', `http://localhost:3100/api/repuestos/eliminar/${idRepuestoPrueba}`);
        console.log('🧹 Limpieza del repuesto de prueba:', r.data?.message || r.error);
    }
    if (idDistribuidorPrueba) {
        const d = await llamarApi(driver, 'DELETE', `http://localhost:3100/api/distribuidores/eliminar/${idDistribuidorPrueba}`);
        console.log('🧹 Limpieza del distribuidor de prueba:', d.data?.message || d.error);
    }
}

(async function suiteEntradaRepuestos() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await prepararDatosDePrueba(driver);

        await driver.get('http://localhost:3000/panel/entradaRepuestos');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Entrada']")), 5000);

        await test1_crearEntradaVacia(driver);
        await test2_cantidadCero(driver);
        await test3_crearEntrada(driver);
        await test4_apareceEnLista(driver);
        await test5_editarEntrada(driver);
        await test6_eliminarEntrada(driver);

        await limpiarDatosDePrueba(driver);

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