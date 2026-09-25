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

**La base local de pruebas.** Son las mismas de las pruebas automatizadas:

```sql
CREATE DATABASE sigat_pruebas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u root -p sigat_pruebas < ruta/del/respaldo_estructura.sql
mysql -u root -p sigat_pruebas < cypress/seed/datos_de_prueba.sql
```

**El archivo `.env` del backend apuntando a ella:**

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=sigat_pruebas
JWT_SECRET=cualquier_clave_para_pruebas
JWT_EXPIRES_IN=2h
```

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
`apoyo.js` comprueba que `DB_NAME` contenga la palabra "prueba"; si no, se
detienen con un aviso y no ejecutan ni una sola petición:

```
Las pruebas integradas se detuvieron por seguridad.
DB_NAME vale "defaultdb" y no parece una base de pruebas.
```

Así, si el `.env` quedó apuntando a la base de Aiven, no pasa nada.

---

## 3. Cómo correrlas

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

## 4. El correo

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

## 5. Qué comprueba cada prueba

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

## 6. Qué cubre cada archivo

| Archivo | Requerimientos que recorre |
|---|---|
| `Cliente.test.js` | RF-M1.1, M1.2, M1.3, M1.4, M1.6, M1.7, M3.1, M3.2, M3.3, M3.5, M4.1 a M4.4 |
| `Tecnico.test.js` | RF-M1.2, M1.4, M2.2, M3.2, M3.3, M3.6, M4.2, M8.1 |
| `Recepcionista.test.js` | RF-M1.2, M1.4, M1.5, M1.9, M2.1 a M2.4, M3.1 a M3.5, M4.1, M4.2, M5.2, M6.1, M8.1 |
| `Administrador.test.js` | RF-M1.2, M1.4, M1.5, M1.6, M1.8, M1.9, M2.1 a M2.4, M3.1 a M3.5, M4.4, M5.1 a M5.5, M6.1 a M6.4, M8.1 a M8.3 |
| `SuperAdministrador.test.js` | RF-M1.2, M1.4, M1.6, M1.9, M7.1 a M7.4, M8.1 a M8.3, y el acceso a todos los módulos |
