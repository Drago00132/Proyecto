const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const readline = require('readline');

const ADMIN_CORREO = 'martinestaquio1@gmail.com';
const ADMIN_CONTRASENA = '12345678';

const resultados = [];
let tokenAdmin = null;
let idClientePrueba = null;
let idMotoPrueba = null;
const PLACA_PRUEBA = `SEL${Date.now().toString().slice(-6)}`;

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

async function llamarApi(driver, metodo, url, cuerpo, conToken = true) {
    return driver.executeAsyncScript(
        function (metodo, url, cuerpo, token, callback) {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = 'Bearer ' + token;
            fetch(url, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined })
                .then((res) => res.json().then((data) => ({ status: res.status, data })))
                .then((resultado) => callback(resultado))
                .catch((err) => callback({ error: err.message }));
        },
        metodo,
        url,
        cuerpo,
        conToken ? tokenAdmin : null
    );
}

// --- Preparación: un cliente y una moto de prueba, necesarios para crear un historial ---
async function prepararDatosDePrueba(driver) {
    const sufijo = Date.now().toString().slice(-8);
    const resultadoCliente = await llamarApi(driver, 'POST', 'http://localhost:3100/api/usuarios/registrar-publico', {
        numero_identidad: '7' + sufijo,
        tipo_documento: 'Cedula de Ciudadania',
        nombre: 'Cliente',
        apellido: 'Selenium',
        fecha_nacimiento: '2000-01-01',
        numero_celular: '3' + sufijo,
        correo_electronico: `cliente.historial.selenium.${Date.now()}@gmail.com`,
        contrasena: 'Prueba1234'
    }, false);
    idClientePrueba = resultadoCliente.data?.numero_identidad;
    if (!idClientePrueba) throw new Error('No se pudo crear el cliente de prueba: ' + JSON.stringify(resultadoCliente));

    const resultadoMoto = await llamarApi(driver, 'POST', 'http://localhost:3100/api/motos/agregar', {
        numero_identidad: idClientePrueba,
        marca_moto: 'Yamaha',
        modelo_moto: 'FZ Selenium',
        placa: PLACA_PRUEBA
    });
    idMotoPrueba = resultadoMoto.data?.id_moto;
    if (!idMotoPrueba) throw new Error('No se pudo crear la moto de prueba: ' + JSON.stringify(resultadoMoto));

    console.log(`ℹ️  Cliente de prueba: documento ${idClientePrueba}`);
    console.log(`ℹ️  Moto de prueba: placa ${PLACA_PRUEBA} (id ${idMotoPrueba})`);
}

async function abrirModalAgregar(driver) {
    await clicPorTexto(driver, 'Agregar Historial');
    await driver.wait(until.elementLocated(By.id('historial-agregar-cliente')), 5000);
    await driver.wait(async () => {
        const opciones = await driver.findElements(By.css('#historial-agregar-cliente option'));
        return opciones.length > 1;
    }, 5000);
}

async function seleccionarClienteYMoto(driver) {
    const selectCliente = new Select(await driver.findElement(By.id('historial-agregar-cliente')));
    await selectCliente.selectByValue(String(idClientePrueba));

    await driver.wait(async () => {
        const opciones = await driver.findElements(By.css('#historial-agregar-moto option'));
        return opciones.length > 1;
    }, 5000);
    const selectMoto = new Select(await driver.findElement(By.id('historial-agregar-moto')));
    await selectMoto.selectByValue(String(idMotoPrueba));
}

// --- Prueba 1: descripción del problema muy corta (<10 caracteres) ---
async function test1_descripcionCorta(driver) {
    try {
        await abrirModalAgregar(driver);
        await seleccionarClienteYMoto(driver);
        await driver.findElement(By.id('historial-agregar-descripcion-problema')).sendKeys('corta');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        if (!texto.toLowerCase().includes('10')) {
            throw new Error(`Se esperaba el mensaje sobre longitud mínima, llegó: "${texto}"`);
        }
        registrarResultado('Descripción muy corta muestra error específico', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Descripción muy corta muestra error específico', false, err.message);
    }
}

// --- Prueba 2: crear un historial válido ---
async function test2_crearHistorial(driver) {
    try {
        await abrirModalAgregar(driver);
        await seleccionarClienteYMoto(driver);
        await driver.findElement(By.id('historial-agregar-descripcion-problema'))
            .sendKeys('La moto no enciende, prueba automatizada con Selenium.');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear historial válido', true, texto);
    } catch (err) {
        registrarResultado('Crear historial válido', false, err.message);
    }
}

// --- Prueba 3: aparece en la lista ---
async function test3_apareceEnLista(driver) {
    try {
        await driver.wait(until.elementLocated(By.xpath(`//td[contains(text(), '${PLACA_PRUEBA}')]`)), 5000);
        registrarResultado('El historial creado aparece en la lista', true);
    } catch (err) {
        registrarResultado('El historial creado aparece en la lista', false, err.message);
    }
}

// --- Prueba 4: RN-010, no se puede crear un segundo historial activo para la misma moto ---
async function test4_motoConHistorialActivo(driver) {
    try {
        await driver.get('http://localhost:3000/panel/historial');
        await abrirModalAgregar(driver);
        await seleccionarClienteYMoto(driver);
        await driver.findElement(By.id('historial-agregar-descripcion-problema'))
            .sendKeys('Segundo intento sobre la misma moto, no debería dejar.');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('No se puede crear un segundo historial activo para la misma moto (RN-010)', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('No se puede crear un segundo historial activo para la misma moto (RN-010)', false, err.message);
    }
}

// --- Prueba 5: asignar técnico desde Editar, y verificar el autoavance a "En Proceso" ---
async function test5_asignarTecnicoAutoavanzaEstado(driver) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[contains(text(), '${PLACA_PRUEBA}')]/parent::tr`));
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        await driver.wait(until.elementLocated(By.id('historial-editar-tecnico')), 5000);
        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#historial-editar-tecnico option'));
            return opciones.length > 1;
        }, 5000);

        const selectTecnico = new Select(await driver.findElement(By.id('historial-editar-tecnico')));
        await selectTecnico.selectByIndex(1); // el primer técnico real disponible

        await clicPorTexto(driver, 'Guardar');
        await esperarToast(driver, 'success');

        // Reabre el mismo historial para confirmar que el estado ya quedó en "En Proceso".
        await driver.get('http://localhost:3000/panel/historial');
        const filaOtraVez = await driver.wait(until.elementLocated(By.xpath(`//td[contains(text(), '${PLACA_PRUEBA}')]/parent::tr`)), 5000);
        const botonEditarOtraVez = await filaOtraVez.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditarOtraVez);

        const selectEstado = await driver.wait(until.elementLocated(By.id('historial-editar-estado')), 5000);
        const estadoActual = await selectEstado.getAttribute('value');

        if (estadoActual !== 'En Proceso') {
            throw new Error(`Se esperaba que el estado avanzara a "En Proceso", quedó en "${estadoActual}"`);
        }
        registrarResultado('Asignar técnico avanza el estado a "En Proceso" automáticamente', true);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Asignar técnico avanza el estado a "En Proceso" automáticamente', false, err.message);
    }
}

// --- Prueba 6: eliminar el historial de prueba ---
async function test6_eliminarHistorial(driver) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[contains(text(), '${PLACA_PRUEBA}')]/parent::tr`));
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.css('.modal.d-block .btn-danger')), 5000);
        const botonConfirmar = await driver.findElement(By.css('.modal.d-block .btn-danger'));
        await clicJS(driver, botonConfirmar);

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar historial', true, texto);
    } catch (err) {
        registrarResultado('Eliminar historial', false, err.message);
    }
}

async function limpiarDatosDePrueba(driver) {
    if (idMotoPrueba) {
        const m = await llamarApi(driver, 'DELETE', `http://localhost:3100/api/motos/eliminar/${idMotoPrueba}`);
        console.log('🧹 Limpieza de la moto de prueba:', m.data?.message || m.error);
    }
    if (idClientePrueba) {
        const u = await llamarApi(driver, 'DELETE', `http://localhost:3100/api/usuarios/eliminar/${idClientePrueba}`);
        console.log('🧹 Limpieza del cliente de prueba:', u.data?.message || u.error);
    }
}

(async function suiteHistorial() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await prepararDatosDePrueba(driver);

        await driver.get('http://localhost:3000/panel/historial');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Historial']")), 5000);

        await test1_descripcionCorta(driver);
        await test2_crearHistorial(driver);
        await test3_apareceEnLista(driver);
        await test4_motoConHistorialActivo(driver);
        await test5_asignarTecnicoAutoavanzaEstado(driver);
        await test6_eliminarHistorial(driver);

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