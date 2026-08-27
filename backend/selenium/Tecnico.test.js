const { Builder, By, until } = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const XLSX = require('xlsx');

const ADMIN_CORREO = 'martinestaquio1@gmail.com';
const ADMIN_CONTRASENA = '12345678';

const RUTA_EXCEL_TEMPORAL = path.join(__dirname, 'tecnico-prueba-temp.xlsx');

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

// Genera un Excel de un solo técnico, con documento y correo únicos en cada corrida.
function generarExcelDePrueba() {
    const base = Date.now().toString().slice(-8);
    const tecnico = {
        numero_identidad: '8' + base,
        tipo_documento: 'Cedula de Ciudadania',
        nombre: 'Tecnico',
        apellido: 'Selenium',
        fecha_nacimiento: '2000-01-01',
        numero_celular: '3' + base,
        correo_electronico: `tecnico.selenium.${Date.now()}@gmail.com`,
        contrasena: 'Prueba1234'
    };

    const hoja = XLSX.utils.json_to_sheet([tecnico]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Tecnicos');
    XLSX.writeFile(libro, RUTA_EXCEL_TEMPORAL);

    return tecnico;
}

// --- Prueba 1: carga masiva con un archivo Excel válido ---
async function test1_cargaMasiva(driver, tecnico) {
    try {
        await clicPorTexto(driver, 'subir Tecnico');
        await driver.wait(until.elementLocated(By.css("input[type='file']")), 5000);

        const inputArchivo = await driver.findElement(By.css("input[type='file']"));
        await inputArchivo.sendKeys(RUTA_EXCEL_TEMPORAL);

        await clicPorTexto(driver, 'Subir Técnicos');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Carga masiva de técnicos con Excel válido', true, texto);
    } catch (err) {
        registrarResultado('Carga masiva de técnicos con Excel válido', false, err.message);
    }
}

// --- Prueba 2: el técnico cargado aparece en la lista ---
async function test2_tecnicoApareceEnLista(driver, tecnico) {
    try {
        const campoBusqueda = await driver.findElement(By.css("input[placeholder='Buscar por numero de identidad']"));
        await campoBusqueda.sendKeys(tecnico.numero_identidad);
        await clicPorTexto(driver, 'Buscar');

        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${tecnico.numero_identidad}']`)), 5000);
        registrarResultado('El técnico cargado aparece en la lista (y quedó con id_rol=2, no el que traía el Excel)', true);
    } catch (err) {
        registrarResultado('El técnico cargado aparece en la lista', false, err.message);
    }
}

// --- Prueba 3: editar las reparaciones asignadas del técnico ---
async function test3_editarTecnico(driver, tecnico) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${tecnico.numero_identidad}']/parent::tr`));
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoReparaciones = await driver.wait(until.elementLocated(By.id('tecnico-editar-reparaciones')), 5000);
        await campoReparaciones.clear();
        await campoReparaciones.sendKeys('3');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar reparaciones asignadas del técnico', true, texto);
    } catch (err) {
        registrarResultado('Editar reparaciones asignadas del técnico', false, err.message);
    }
}

// --- Prueba 4: eliminar la ficha del técnico (vía la UI) ---
async function test4_eliminarFichaTecnico(driver, tecnico) {
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${tecnico.numero_identidad}']/parent::tr`));
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar la ficha de técnico', true, texto);
    } catch (err) {
        registrarResultado('Eliminar la ficha de técnico', false, err.message);
    }
}

// --- Limpieza: la ficha ya se borró en la prueba 4, pero el usuario (rol Técnico) sigue existiendo
// en la tabla usuarios; se borra directo por la API para no dejar cuentas huérfanas. ---
async function limpiarUsuarioTecnico(driver, tecnico) {
    try {
        const token = await driver.executeScript('return window.localStorage.getItem("token");');
        const resultado = await driver.executeAsyncScript(
            function (token, idUsuario, callback) {
                fetch('http://localhost:3100/api/usuarios/eliminar/' + idUsuario, {
                    method: 'DELETE',
                    headers: { Authorization: 'Bearer ' + token }
                })
                    .then((res) => res.json())
                    .then((data) => callback(data))
                    .catch((err) => callback({ error: err.message }));
            },
            token,
            tecnico.numero_identidad
        );
        console.log('🧹 Limpieza del usuario técnico:', resultado.message || resultado.error);
    } catch (err) {
        console.log('⚠️  No se pudo eliminar automáticamente el usuario técnico. Bórralo manualmente, documento:', tecnico.numero_identidad);
    } finally {
        if (fs.existsSync(RUTA_EXCEL_TEMPORAL)) {
            fs.unlinkSync(RUTA_EXCEL_TEMPORAL);
        }
    }
}

(async function suiteTecnicos() {
    let driver = await new Builder().forBrowser('chrome').build();
    const tecnico = generarExcelDePrueba();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await driver.get('http://localhost:3000/panel/tecnico');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='subir Tecnico']")), 5000);

        await test1_cargaMasiva(driver, tecnico);
        await test2_tecnicoApareceEnLista(driver, tecnico);
        await test3_editarTecnico(driver, tecnico);
        await test4_eliminarFichaTecnico(driver, tecnico);
        await limpiarUsuarioTecnico(driver, tecnico);

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