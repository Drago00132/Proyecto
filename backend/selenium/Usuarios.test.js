const { Builder, By, until } = require('selenium-webdriver');
const { Select } = require('selenium-webdriver/lib/select');
const readline = require('readline');

// Cuenta real con rol Administrador/Súper Administrador.
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

function datosUsuarioValido() {
    const base = Date.now().toString().slice(-8);
    return {
        numero_identidad: '9' + base,
        nombre: 'Prueba',
        apellido: 'Selenium',
        fecha_nacimiento: '2000-01-01', // input type="date": formato AAAA-MM-DD
        numero_celular: '3' + base,
        correo: `prueba.usuarios.${Date.now()}@gmail.com`,
        contrasena: 'Prueba1234'
    };
}

async function llenarFormularioAgregar(driver, datos) {
    await driver.findElement(By.id('usuario-agregar-identidad')).sendKeys(datos.numero_identidad);
    const selectDocumento = new Select(await driver.findElement(By.id('usuario-agregar-tipo-documento')));
    await selectDocumento.selectByVisibleText('Cedula de Ciudadania');
    await driver.findElement(By.id('usuario-agregar-nombre')).sendKeys(datos.nombre);
    await driver.findElement(By.id('usuario-agregar-apellido')).sendKeys(datos.apellido);
    await driver.findElement(By.id('usuario-agregar-fecha-nacimiento')).sendKeys(datos.fecha_nacimiento);
    await driver.findElement(By.id('usuario-agregar-celular')).sendKeys(datos.numero_celular);
    await driver.findElement(By.id('usuario-agregar-email')).sendKeys(datos.correo);
    await driver.findElement(By.id('usuario-agregar-contrasena')).sendKeys(datos.contrasena);
}

// --- Prueba 1: el selector de roles carga opciones (roles-asignables funcionando) ---
async function test1_selectorDeRolesCarga(driver) {
    try {
        await clicPorTexto(driver, 'Agregar usuarios');
        await driver.wait(until.elementLocated(By.id('usuario-agregar-rol')), 5000);

        // Espera activa a que el <select> tenga más de la opción "seleccione un rol".
        await driver.wait(async () => {
            const opciones = await driver.findElements(By.css('#usuario-agregar-rol option'));
            return opciones.length > 1;
        }, 5000);

        const opciones = await driver.findElements(By.css('#usuario-agregar-rol option'));
        const textos = await Promise.all(opciones.map((o) => o.getText()));

        if (opciones.length <= 1) {
            throw new Error('El selector de roles sigue vacío (solo trae "seleccione un rol")');
        }
        registrarResultado('El selector de roles carga opciones reales', true, textos.join(', '));

        // Se deja el modal abierto para encadenar con la prueba 2.
    } catch (err) {
        registrarResultado('El selector de roles carga opciones reales', false, err.message);
    }
}

// --- Prueba 2: crear usuario (Cliente) ---
async function test2_crearUsuario(driver) {
    const datos = datosUsuarioValido();
    try {
        await llenarFormularioAgregar(driver, datos);
        const selectRol = new Select(await driver.findElement(By.id('usuario-agregar-rol')));
        await selectRol.selectByVisibleText('cliente');

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Crear usuario (Cliente)', true, texto);
        return datos;
    } catch (err) {
        registrarResultado('Crear usuario (Cliente)', false, err.message);
        return null;
    }
}

// --- Prueba 3: el usuario creado aparece en la búsqueda ---
async function test3_usuarioApareceEnBusqueda(driver, datos) {
    if (!datos) {
        registrarResultado('El usuario creado aparece en la búsqueda', false, 'Se saltó: la prueba 2 no creó un usuario');
        return;
    }
    try {
        const campoBusqueda = await driver.findElement(By.css("input[placeholder='Buscar por numero de identidad']"));
        await campoBusqueda.sendKeys(datos.numero_identidad);
        await clicPorTexto(driver, 'Buscar');

        await driver.wait(until.elementLocated(By.xpath(`//td[normalize-space(text())='${datos.numero_identidad}']`)), 5000);
        registrarResultado('El usuario creado aparece en la búsqueda', true);
    } catch (err) {
        registrarResultado('El usuario creado aparece en la búsqueda', false, err.message);
    }
}

// --- Prueba 4: editar el usuario creado ---
async function test4_editarUsuario(driver, datos) {
    if (!datos) {
        registrarResultado('Editar usuario', false, 'Se saltó: la prueba 2 no creó un usuario');
        return;
    }
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${datos.numero_identidad}']/parent::tr`));
        const botonEditar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Editar']"));
        await clicJS(driver, botonEditar);

        const campoApellido = await driver.wait(until.elementLocated(By.id('usuario-editar-apellido')), 5000);
        await campoApellido.clear();
        await campoApellido.sendKeys('SeleniumEditado');

        await clicPorTexto(driver, 'Guardar');
        const texto = await esperarToast(driver, 'success');

        registrarResultado('Editar usuario', true, texto);
    } catch (err) {
        registrarResultado('Editar usuario', false, err.message);
    }
}

// --- Prueba 5: validaciones de formato dentro del modal de Agregar ---
const casosDeValidacion = [
    {
        nombre: 'Menor de 18 años',
        modificar: (d) => { d.fecha_nacimiento = `${new Date().getFullYear() - 10}-01-01`; },
        fragmentoEsperado: 'mayor de 18'
    },
    {
        nombre: 'Contraseña muy corta',
        modificar: (d) => { d.contrasena = '123'; },
        fragmentoEsperado: 'entre 8 y 20'
    },
    {
        nombre: 'Documento con longitud distinta a 10',
        modificar: (d) => { d.numero_identidad = '123'; },
        fragmentoEsperado: '10 caracteres'
    },
    {
        nombre: 'Nombre con números',
        modificar: (d) => { d.nombre = 'Prueba123'; },
        fragmentoEsperado: 'no debe contener números'
    },
    {
        nombre: 'Correo con dominio no permitido',
        modificar: (d) => { d.correo = `prueba.${Date.now()}@yahoo.com`; },
        fragmentoEsperado: '@gmail.com'
    }
];

async function probarValidacion(driver, caso) {
    try {
        await clicPorTexto(driver, 'Agregar usuarios');
        await driver.wait(until.elementLocated(By.id('usuario-agregar-identidad')), 5000);

        const datos = datosUsuarioValido();
        caso.modificar(datos);
        await llenarFormularioAgregar(driver, datos);

        await clicPorTexto(driver, 'Agregar');
        const texto = await esperarToast(driver, 'error');

        if (!texto.toLowerCase().includes(caso.fragmentoEsperado.toLowerCase())) {
            throw new Error(`Mensaje inesperado. Se esperaba algo con "${caso.fragmentoEsperado}", llegó: "${texto}"`);
        }
        registrarResultado(`Validación: ${caso.nombre}`, true, texto);

        // Cierra el modal (el botón "X" de ModalOverlay no tiene id; se ubica por clase).
        const botonCerrar = await driver.findElement(By.css('.modal.d-block .btn-close'));
        await clicJS(driver, botonCerrar);
    } catch (err) {
        registrarResultado(`Validación: ${caso.nombre}`, false, err.message);
    }
}

// --- Prueba 6: eliminar el usuario creado ---
async function test6_eliminarUsuario(driver, datos) {
    if (!datos) {
        registrarResultado('Eliminar usuario', false, 'Se saltó: la prueba 2 no creó un usuario');
        return;
    }
    try {
        const fila = await driver.findElement(By.xpath(`//td[normalize-space(text())='${datos.numero_identidad}']/parent::tr`));
        const botonEliminar = await fila.findElement(By.xpath(".//button[normalize-space(text())='Eliminar']"));
        await clicJS(driver, botonEliminar);

        // ConfirmarEliminar.js: botón con texto en minúscula "eliminar" (distinto del "Eliminar" de la tabla).
        await driver.wait(until.elementLocated(By.xpath("//button[text()='eliminar']")), 5000);
        await clicPorTexto(driver, 'eliminar');

        const texto = await esperarToast(driver, 'success');
        registrarResultado('Eliminar usuario', true, texto);
    } catch (err) {
        registrarResultado('Eliminar usuario', false, err.message);
    }
}

(async function suiteUsuarios() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.manage().window().maximize();
        await login(driver, ADMIN_CORREO, ADMIN_CONTRASENA);
        await driver.get('http://localhost:3000/panel/usuarios');
        await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(text())='Agregar usuarios']")), 5000);

        await test1_selectorDeRolesCarga(driver);
        const datos = await test2_crearUsuario(driver);
        await test3_usuarioApareceEnBusqueda(driver, datos);
        await test4_editarUsuario(driver, datos);

        for (const caso of casosDeValidacion) {
            await probarValidacion(driver, caso);
        }

        await test6_eliminarUsuario(driver, datos);

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