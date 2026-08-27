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

async function filaDeRol(driver, nombreRol) {
    return driver.findElement(By.xpath(`//td[normalize-space(text())='${nombreRol}']/parent::tr`));
}

// --- Prueba 1: crear rol con el nombre vacío (validación de campo obligatorio) ---
async function test1_crearRolVacio(driver) {
    try {
        await clicPorTexto(driver, 'Agregar Roles');
        await driver.wait(until.elementLocated(By.id('rol-agregar-nombre')), 5000);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        registrarResultado('Crear rol con nombre vacío muestra error', true, texto);

        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado('Crear rol con nombre vacío muestra error', false, err.message);
    }
}

// --- Prueba 2: crear un rol nuevo (no base) ---
async function test2_crearRol(driver) {
    const nombreRol = `Supervisor${Date.now().toString().slice(-6)}`;
    try {
        await clicPorTexto(driver, 'Agregar Roles');
        await driver.wait(until.elementLocated(By.id('rol-agregar-nombre')), 5000);
        await driver.findElement(By.id('rol-agregar-nombre')).sendKeys(nombreRol);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear rol nuevo', true, texto);
        return nombreRol;
    } catch (err) {
        registrarResultado('Crear rol nuevo', false, err.message);
        return null;
    }
}

// --- Prueba 3: el rol creado aparece en la búsqueda ---
async function test3_rolApareceEnLista(driver, nombreRol) {
    if (!nombreRol) {
        registrarResultado('El rol creado aparece en la lista', false, 'Se saltó: la prueba 2 no creó ningún rol');
        return;
    }
    try {
        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${nombreRol}']`)), 5000);
        registrarResultado('El rol creado aparece en la lista', true);
    } catch (err) {
        registrarResultado('El rol creado aparece en la lista', false, err.message);
    }
}

// --- Prueba 4: editar el rol creado ---
async function test4_editarRol(driver, nombreRol) {
    if (!nombreRol) {
        registrarResultado('Editar rol', false, 'Se saltó: la prueba 2 no creó ningún rol');
        return null;
    }
    const nombreEditado = `${nombreRol}Editado`;
    try {
        const fila = await filaDeRol(driver, nombreRol);
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoRol = await driver.wait(until.elementLocated(By.id('rol-editar-nombre')), 5000);
        await campoRol.clear();
        await campoRol.sendKeys(nombreEditado);

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar rol', true, texto);
        return nombreEditado;
    } catch (err) {
        registrarResultado('Editar rol', false, err.message);
        return nombreRol; // por si la edición falló mid-flight, se sigue buscando con el nombre original
    }
}

// --- Prueba 5: NO se puede eliminar un rol base (RN-023) ---
async function test5_noEliminaRolBase(driver) {
    try {
        await driver.get('http://localhost:3000/panel/roles');
        const fila = await driver.wait(until.elementLocated(By.xpath("//td[normalize-space(text())='administrador']/parent::tr")), 5000);
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'error');
        if (!texto.toLowerCase().includes('rol base')) {
            throw new Error(`Se esperaba un mensaje sobre "rol base", llegó: "${texto}"`);
        }

        // Confirma que "administrador" sigue en la lista.
        await driver.findElement(By.xpath("//td[normalize-space(text())='administrador']"));
        registrarResultado('No se puede eliminar un rol base (RN-023)', true, texto);
    } catch (err) {
        registrarResultado('No se puede eliminar un rol base (RN-023)', false, err.message);
    }
}

// --- Prueba 6: sí se puede eliminar el rol creado en la prueba 2 (no es base, sin usuarios) ---
async function test6_eliminarRolCreado(driver, nombreRol) {
    if (!nombreRol) {
        registrarResultado('Eliminar el rol creado', false, 'Se saltó: no hay rol creado para eliminar');
        return;
    }
    try {
        const fila = await filaDeRol(driver, nombreRol);
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar el rol creado (sin restricciones)', true, texto);
    } catch (err) {
        registrarResultado('Eliminar el rol creado (sin restricciones)', false, err.message);
    }
}

(async function suiteRoles() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, SUPER_ADMIN_CORREO, SUPER_ADMIN_CONTRASENA);
        await driver.get('http://localhost:3000/panel/roles');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar Roles']")), 5000);

        await test1_crearRolVacio(driver);
        const nombreRol = await test2_crearRol(driver);
        await test3_rolApareceEnLista(driver, nombreRol);
        const nombreFinal = await test4_editarRol(driver, nombreRol);
        await test5_noEliminaRolBase(driver);
        await test6_eliminarRolCreado(driver, nombreFinal);

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