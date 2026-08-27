const { Builder, By, until } = require('selenium-webdriver');
const readline = require('readline');

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

async function irAMiPerfil(driver) {
    await driver.get('http://localhost:3000/panel/mi-perfil');
    await driver.wait(until.elementLocated(By.id('miperfil-nombre')), 5000);
}

async function leerValoresActuales(driver) {
    return {
        nombre: await driver.findElement(By.id('miperfil-nombre')).getAttribute('value'),
        apellido: await driver.findElement(By.id('miperfil-apellido')).getAttribute('value'),
        correo: await driver.findElement(By.id('miperfil-correo')).getAttribute('value'),
        celular: await driver.findElement(By.id('miperfil-celular')).getAttribute('value')
    };
}

async function llenarYGuardar(driver, datos) {
    const campoNombre = await driver.findElement(By.id('miperfil-nombre'));
    await campoNombre.clear();
    await campoNombre.sendKeys(datos.nombre);

    const campoApellido = await driver.findElement(By.id('miperfil-apellido'));
    await campoApellido.clear();
    await campoApellido.sendKeys(datos.apellido);

    const campoCorreo = await driver.findElement(By.id('miperfil-correo'));
    await campoCorreo.clear();
    await campoCorreo.sendKeys(datos.correo);

    const campoCelular = await driver.findElement(By.id('miperfil-celular'));
    await campoCelular.clear();
    await campoCelular.sendKeys(datos.celular);

    const boton = await driver.findElement(By.xpath("//button[normalize-space(text())='Guardar cambios']"));
    await clicJS(driver, boton);
}

// --- Prueba 1: los datos de solo lectura están deshabilitados y vienen con información real ---
async function test1_datosSoloLecturaCorrectos(driver) {
    try {
        const identidad = await driver.findElement(By.id('miperfil-identidad'));
        const tipoDocumento = await driver.findElement(By.id('miperfil-tipo-documento'));
        const fechaNacimiento = await driver.findElement(By.id('miperfil-fecha-nacimiento'));

        const valorIdentidad = await identidad.getAttribute('value');
        const disabledIdentidad = await identidad.getAttribute('disabled');
        const disabledTipoDocumento = await tipoDocumento.getAttribute('disabled');
        const disabledFecha = await fechaNacimiento.getAttribute('disabled');

        if (!valorIdentidad) throw new Error('El número de identidad llegó vacío; el perfil no cargó los datos reales');
        if (!disabledIdentidad || !disabledTipoDocumento || !disabledFecha) {
            throw new Error('Alguno de los campos informativos NO está deshabilitado (se podría editar por consola)');
        }
        registrarResultado('Los datos de solo lectura cargan y están deshabilitados', true, `documento: ${valorIdentidad}`);
    } catch (err) {
        registrarResultado('Los datos de solo lectura cargan y están deshabilitados', false, err.message);
    }
}

// --- Prueba 2: guardar con el nombre vacío muestra el error del lado del cliente ---
async function test2_nombreVacio(driver) {
    try {
        const campoNombre = await driver.findElement(By.id('miperfil-nombre'));
        await campoNombre.clear();

        const boton = await driver.findElement(By.xpath("//button[normalize-space(text())='Guardar cambios']"));
        await clicJS(driver, boton);

        const texto = await esperarToast(driver, 'error');
        if (!texto.includes('Nombre y correo son obligatorios')) {
            throw new Error(`Mensaje inesperado: "${texto}"`);
        }
        registrarResultado('Guardar con nombre vacío muestra error (validación de cliente)', true, texto);
    } catch (err) {
        registrarResultado('Guardar con nombre vacío muestra error (validación de cliente)', false, err.message);
    }
}

// --- Prueba 3: editar y guardar correctamente ---
async function test3_editarYGuardar(driver, valoresOriginales) {
    try {
        await irAMiPerfil(driver); // recarga para limpiar el estado tras la prueba 2

        const sufijo = Date.now().toString().slice(-6);
        const nuevosDatos = {
            nombre: `${valoresOriginales.nombre}Editado${sufijo}`,
            apellido: valoresOriginales.apellido,
            correo: valoresOriginales.correo,
            celular: valoresOriginales.celular
        };

        await llenarYGuardar(driver, nuevosDatos);
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar y guardar el perfil', true, texto);
        return nuevosDatos;
    } catch (err) {
        registrarResultado('Editar y guardar el perfil', false, err.message);
        return null;
    }
}

// --- Prueba 4: el cambio persiste después de recargar (confirma que el PUT sí guardó) ---
async function test4_cambioPersiste(driver, nuevosDatos) {
    if (!nuevosDatos) {
        registrarResultado('El cambio persiste tras recargar', false, 'Se saltó: la prueba 3 no guardó ningún cambio');
        return;
    }
    try {
        await irAMiPerfil(driver);
        const valorNombre = await driver.findElement(By.id('miperfil-nombre')).getAttribute('value');

        if (valorNombre !== nuevosDatos.nombre) {
            throw new Error(`Se esperaba "${nuevosDatos.nombre}", pero el campo trae "${valorNombre}" tras recargar`);
        }
        registrarResultado('El cambio persiste tras recargar la página', true);
    } catch (err) {
        registrarResultado('El cambio persiste tras recargar la página', false, err.message);
    }
}

// --- Restaura los datos originales, para no dejar la cuenta real modificada ---
async function restaurarValoresOriginales(driver, valoresOriginales) {
    try {
        await irAMiPerfil(driver);
        await llenarYGuardar(driver, valoresOriginales);
        await esperarToast(driver, 'success');
        console.log('🧹 Perfil restaurado a sus valores originales:', valoresOriginales);
    } catch (err) {
        console.log('⚠️  No se pudo restaurar el perfil automáticamente. Verifica manualmente que quedó así:', valoresOriginales);
        console.log('   Motivo:', err.message);
    }
}

(async function suiteMiPerfil() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await irAMiPerfil(driver);

        const valoresOriginales = await leerValoresActuales(driver);
        console.log('ℹ️  Valores originales del perfil (se restaurarán al final):', valoresOriginales);

        await test1_datosSoloLecturaCorrectos(driver);
        await test2_nombreVacio(driver);
        const nuevosDatos = await test3_editarYGuardar(driver, valoresOriginales);
        await test4_cambioPersiste(driver, nuevosDatos);

        await restaurarValoresOriginales(driver, valoresOriginales);

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