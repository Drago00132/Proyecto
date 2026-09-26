# Pruebas integradas de SIGAT

Mientras las **pruebas unitarias** (`test/unitarias/`) revisan cada controlador
por separado, con la base de datos simulada, estas **pruebas integradas**
levantan el sistema de verdad y comprueban que las piezas funcionan juntas:
cada prueba manda una petición real que recorre la ruta, el control de
permisos, el controlador, el modelo y la base de datos, y después comprueba en
la propia base que lo que dijo la respuesta quedó realmente guardado.

Están organizadas **por rol**: un archivo por cada tipo de usuario, con todo lo
que ese rol puede hacer en el sistema, requerimiento por requerimiento.

```
test/integradas/
  apoyo.js                     Apoyo común (inicio de sesión, limpieza, consultas)
  archivos/                    Archivos Excel para la carga masiva
  Cliente.test.js              38 pruebas — todo lo que puede hacer el Cliente
  Tecnico.test.js              23 pruebas — todo lo que puede hacer el Técnico
  Recepcionista.test.js        40 pruebas — todo lo que puede hacer el Recepcionista
  Administrador.test.js        49 pruebas — todo lo que puede hacer el Administrador
  SuperAdministrador.test.js   24 pruebas — todo lo que puede hacer el Súper Administrador
```

Son **174 pruebas integradas**, que junto con las 166 unitarias dan **340
pruebas** en total.

Dentro de cada archivo, los bloques van por requerimiento y cada prueba lleva
el código del caso, para poder cruzarlas con el documento *Casos de Prueba*:

```
describe('RF-M4.1 — Registrar motocicleta')
    it('CP-096 — El cliente registra su motocicleta')
    it('CP-097 — Rechaza una placa que ya está registrada')
```

Cada archivo termina con un bloque **"Permisos que no tiene"**, que comprueba
que ese rol no alcanza lo que no le corresponde. Ahí está buena parte del valor
de estas pruebas: no solo que cada rol pueda hacer lo suyo, sino que no pueda
hacer lo ajeno.

---

## 1. Qué hace falta para correrlas

**Una base de datos local con la estructura del sistema.** Sirve la misma que
usa para desarrollar (`sigat`), o una aparte si prefiere no mezclar. Lo único
imprescindible es que sea **local**: las pruebas nunca deben correr contra la
base que está en internet.

A esa base hay que cargarle los datos de partida:

```bash
mysql -u root -p sigat < ../cypress/seed/datos_de_prueba.sql
```

**El archivo `.env` del backend apuntando a ella, con la confirmación:**

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=sigat
JWT_SECRET=cualquier_clave_para_pruebas
JWT_EXPIRES_IN=2h

PRUEBAS_BD_OK=si
```

La última línea es la confirmación de que esa base se puede usar para pruebas.
Sin ella, las pruebas se detienen sin tocar nada.

**No hace falta levantar el backend.** Jest carga la aplicación en memoria
(`app.js` ya se exporta sin ponerse a escuchar) y le habla directamente con
supertest. Solo tiene que estar disponible la base de datos.

**Una dependencia nueva**, una sola vez:

```bash
npm install --save-dev supertest
```

---

## 2. Salvaguarda contra la base de producción

Estas pruebas **crean, editan y borran registros**. Antes de tocar nada,
`apoyo.js` comprueba dos cosas, y las dos tienen que cumplirse:

1. **Que el servidor sea el de esta misma máquina** (`DB_HOST` igual a
   `localhost` o `127.0.0.1`). Así, se llame como se llame la base, las
   pruebas no pueden correr contra la de producción en Aiven.
2. **Que el `.env` tenga la línea `PRUEBAS_BD_OK=si`.** Es una confirmación a
   propósito: nadie corre estas pruebas sin saber que van a escribir en esa
   base.

Si falta cualquiera de las dos, se detienen sin ejecutar ni una sola petición:

```
Las pruebas integradas se detuvieron por seguridad.
DB_HOST vale "sigat-db.aivencloud.com", que no es esta máquina.
Estas pruebas crean, editan y borran registros: solo pueden correr
contra una base de datos local, nunca contra la de producción.
```

## Antes de nada: el diagnóstico

Si algo no arranca, no hay que adivinar. Desde la carpeta `backend`:

```bash
node test/integradas/diagnostico.js
```

Revisa uno por uno los requisitos (configuración, dependencias, conexión,
base, tablas, disparadores y datos de partida) y dice en español qué falta y
qué comando ejecutar. No modifica nada y no muestra la contraseña.

---

## 3. Las pruebas corren una detrás de otra, nunca a la vez

Todos estos archivos trabajan sobre **una sola base de datos**. Si dos
corrieran al mismo tiempo, uno abriría un servicio en la moto de prueba
mientras el otro la está limpiando, o los dos intentarían registrar un usuario
a la vez. Los fallos que salen de ahí no son fallos del sistema: son dos
pruebas pisándose.

Por eso el archivo `jest.config.js` de la carpeta `backend` trae
`maxWorkers: 1`. Jest, por su cuenta, reparte los archivos entre varios
procesos según los núcleos que tenga el equipo, así que **sin esa línea el
resultado cambia de un computador a otro**. Con ella, los archivos corren uno
detrás de otro y el resultado es el mismo siempre.

No hay que hacer nada especial: la configuración ya está puesta.

## 4. Cómo correrlas

```bash
npm test Cliente             # solo las del Cliente
npm test Tecnico             # solo las del Técnico
npm test integradas          # todas las integradas
npm test                     # unitarias e integradas de una vez
```

Jest filtra por el nombre del archivo, así que basta con escribir una parte del
nombre. Tenga en cuenta que `npm test` a secas ahora también corre las
integradas, y esas sí necesitan la base de pruebas disponible; las unitarias
siguen corriendo solas sin base de datos.

---

## 5. El correo

Lo único que no es real en estas pruebas es el envío de correo. El sistema
manda dos correos: el código de verificación en dos pasos (Administrador y
Súper Administrador) y el enlace para recuperar la contraseña. En las pruebas
ese envío se reemplaza, por dos razones: para no mandar correos de verdad en
cada corrida, y para que una caída del servidor de correo no haga fallar
pruebas que no tienen nada que ver con el correo.

El resto del flujo sí es real: el código de verificación y el enlace se generan
y se guardan en la base como siempre, y las pruebas los leen de ahí, igual que
haría la persona al abrir su buzón.

---

## 6. Qué comprueba cada prueba

Siempre las dos caras:

- **La respuesta del sistema** — el código (200, 201, 400, 403, 404, 409) y el
  mensaje que devuelve.
- **La base de datos** — que el registro quedó creado, cambiado o borrado de
  verdad, y que lo que no debía cambiar sigue igual.

Por ejemplo, la prueba del registro público no se conforma con el "usuario
registrado exitosamente": comprueba además que el usuario quedó con rol
Cliente aunque la petición pidiera el rol Administrador, y que la contraseña
quedó cifrada y no en texto plano.

Los datos que crean las pruebas usan documentos de la serie `19000009xx` y
placas `INT9xx`, y se borran al terminar, de modo que la base queda como estaba
y las pruebas se pueden repetir las veces que haga falta. Se comprobó corriendo
la suite completa dos veces seguidas: la base queda con los mismos 7 usuarios,
3 motos, 2 repuestos con sus mismas cantidades, 1 distribuidor y 5 roles con
los que arranca, y sin servicios ni entradas sueltas.

---

## 7. Qué cubre cada archivo

| Archivo | Requerimientos que recorre |
|---|---|
| `Cliente.test.js` | RF-M1.1, M1.2, M1.3, M1.4, M1.6, M1.7, M3.1, M3.2, M3.3, M3.5, M4.1 a M4.4 |
| `Tecnico.test.js` | RF-M1.2, M1.4, M2.2, M3.2, M3.3, M3.6, M4.2, M8.1 |
| `Recepcionista.test.js` | RF-M1.2, M1.4, M1.5, M1.9, M2.1 a M2.4, M3.1 a M3.5, M4.1, M4.2, M5.2, M6.1, M8.1 |
| `Administrador.test.js` | RF-M1.2, M1.4, M1.5, M1.6, M1.8, M1.9, M2.1 a M2.4, M3.1 a M3.5, M4.4, M5.1 a M5.5, M6.1 a M6.4, M8.1 a M8.3 |
| `SuperAdministrador.test.js` | RF-M1.2, M1.4, M1.6, M1.9, M7.1 a M7.4, M8.1 a M8.3, y el acceso a todos los módulos |
