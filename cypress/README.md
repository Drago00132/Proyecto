# Pruebas automatizadas de SIGAT (Cypress)

Estas pruebas recorren el sistema como lo haría una persona: abren el
navegador, diligencian los formularios y comprueban lo que aparece en
pantalla y lo que queda guardado en la base de datos.

Están organizadas igual que las pruebas unitarias: **un archivo por
requerimiento funcional**, y dentro de cada archivo **un `it` por cada caso
de prueba** del documento *Casos de Prueba*. El nombre del archivo y el de
cada prueba llevan el código para poder cruzarlos con la documentación:

```
cypress/e2e/Usuarios/RF-M1.1_Registrar_usuario_publico.cy.js
    it('CP-001 — ...')
    it('CP-002 — ...')
```

---

## 1. Antes de empezar: la base de datos de pruebas

Las pruebas **crean, editan y borran registros**. Por eso corren contra una
base local aparte, nunca contra la base de producción en Aiven.

```sql
CREATE DATABASE sigat_pruebas
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Cargue en ella la estructura del sistema (tablas, vistas y disparadores) y
después los datos de prueba:

```bash
mysql -u root -p sigat_pruebas < ruta/del/respaldo_estructura.sql
mysql -u root -p sigat_pruebas < cypress/seed/datos_de_prueba.sql
```

El archivo de datos de prueba deja seis usuarios, uno por rol, todos con la
contraseña `Sigat2026!`:

| Rol                 | Documento   | Correo                          |
|---------------------|-------------|---------------------------------|
| Cliente             | 1900000001  | cliente.pruebas@gmail.com       |
| Cliente (2.º)       | 1900000003  | cliente2.pruebas@gmail.com      |
| Técnico             | 1900000002  | tecnico.pruebas@gmail.com       |
| Recepcionista       | 1900000016  | recepcion.pruebas@gmail.com     |
| Administrador       | 1900000010  | admin.pruebas@gmail.com         |
| Administrador (2.º) | 1900000011  | admin2.pruebas@gmail.com        |
| Súper Administrador | 1900000017  | superadmin.pruebas@gmail.com    |

Además deja tres motos de prueba (`PRB001` y `PRB002` del primer cliente,
`PRB003` del segundo), dos repuestos y un distribuidor. El segundo cliente y
su moto existen para comprobar que nadie ve los servicios de otro.

---

## 2. Apuntar el backend a la base de pruebas

En el archivo `.env` del backend, mientras corren las pruebas:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=su_contraseña
DB_NAME=sigat_pruebas
FRONTEND_URL=http://localhost:3000
```

**El correo saliente tiene que funcionar.** El inicio de sesión del
Administrador y del Súper Administrador envía un código de verificación, y
la recuperación de contraseña envía un enlace; si el envío falla, el
servidor responde con error y esas pruebas no pasan. Las credenciales de
correo son las mismas que ya usa el sistema (`config/mailer.js`).

Las pruebas no abren el buzón: leen el código y el enlace directamente de la
base de pruebas, pero el sistema sí necesita haberlos podido enviar.

---

## 3. Instalar y levantar todo

Una sola vez, en la raíz del proyecto:

```bash
npm install
npm install --save-dev cypress mysql2
```

Después, con **tres terminales abiertas**:

```bash
# 1) Backend
cd backend && npm start          # queda escuchando en http://localhost:3100

# 2) Frontend
cd frontend && npm start         # queda escuchando en http://localhost:3000

# 3) Pruebas
npx cypress run                  # todas, sin ventana
npx cypress open                 # eligiéndolas una por una, viendo el navegador
```

---

## 4. Si sus puertos o su base son otros

Se pueden cambiar por variables de entorno, sin tocar el código:

| Variable        | Para qué sirve                         | Valor por defecto |
|-----------------|----------------------------------------|-------------------|
| `CY_DB_HOST`    | Servidor de la base de pruebas         | `localhost`       |
| `CY_DB_PORT`    | Puerto de la base                      | `3306`            |
| `CY_DB_USER`    | Usuario de la base                     | `root`            |
| `CY_DB_PASSWORD`| Contraseña de la base                  | *(vacía)*         |
| `CY_DB_NAME`    | Nombre de la base de pruebas           | `sigat_pruebas`   |
| `CY_API_URL`    | Dirección del backend                  | `http://localhost:3100` |

La dirección del frontend se cambia en `baseUrl`, dentro de
`cypress.config.js`.

---

## 5. Cómo está armado

```
cypress.config.js              Configuración y conexión a la base de pruebas
cypress/
  e2e/
    Usuarios/                  Un archivo por requerimiento del módulo
  fixtures/
    usuarios.json              Los seis usuarios de prueba
    archivos/                  Archivos Excel para la carga masiva
  seed/
    datos_de_prueba.sql        Datos de partida de la base de pruebas
  support/
    commands.js                Órdenes reutilizables (entrar, buscar, avisos)
    e2e.js                     Configuración común a todas las pruebas
```

### Órdenes propias disponibles

| Orden                          | Qué hace                                                        |
|--------------------------------|-----------------------------------------------------------------|
| `cy.iniciarSesion(usuario, contraseña)` | Diligencia y envía el formulario de ingreso            |
| `cy.entrarComo('administrador')`| Entra con uno de los usuarios de prueba; resuelve el código de verificación cuando el rol lo exige |
| `cy.irASeccion('usuarios')`     | Abre una sección desde el menú lateral                          |
| `cy.verAviso('texto')`          | Comprueba que salió el aviso emergente con ese texto            |
| `cy.cerrarSesion()`             | Cierra la sesión desde el menú                                  |
| `cy.tokenApi('recepcionista')`  | Consigue una credencial llamando a la API, sin abrir pantallas   |
| `cy.peticionApi(token, opciones)`| Llama a la API con esa credencial                              |
| `cy.datosUsuario(doc, rol, etiqueta)` | Arma un juego de datos válido para crear un usuario desechable |
| `cy.idMoto('PRB001')`           | Identificador interno de una moto de prueba por su placa        |
| `cy.idTecnicoPrueba()`          | Identificador de la ficha del técnico de prueba                 |
| `cy.idRepuesto('Bujia de prueba')` | Identificador de un repuesto de prueba por su nombre         |
| `cy.crearServicio(token, datos)`| Deja montado un servicio para que la prueba lo revise en pantalla |

### Ayudas que leen la base de pruebas

Se usan con `cy.task('nombre', dato)`:

`codigo2FA`, `tokenRecuperacion`, `vencerTokenRecuperacion`,
`desbloquearCuenta`, `consultaBD`, `ejecutarBD`, `borrarUsuario`,
`hashContrasena`, `restaurarContrasena`, `limpiarServicios`,
`borrarRepuesto`, `borrarMoto`, `borrarEntrada`, `borrarRol`,
`borrarDistribuidor`, `limpiarAsignaciones`.

Sirven para no depender del correo ni de esperas reales: por ejemplo,
`vencerTokenRecuperacion` adelanta el vencimiento de un enlace para poder
comprobar el caso del enlace expirado sin esperar quince minutos.

---

## 6. Qué comprueba cada prueba

Cada `it` comprueba **las dos cosas**: lo que el usuario ve en pantalla (el
aviso, el listado, el botón deshabilitado) y lo que quedó realmente en la
base de datos. Así una prueba no pasa solo porque salió un mensaje bonito.

Las pruebas que crean usuarios usan documentos de la serie `19000008xx` y
los borran al terminar, de modo que la base queda como estaba y las pruebas
se pueden volver a correr las veces que haga falta.

---

## 7. Cobertura actual

| Requerimiento | Casos de prueba | Archivo |
|---------------|-----------------|---------|
| RF-M1.1 Registrar usuario (público) | CP-001 a CP-005 | `RF-M1.1_Registrar_usuario_publico.cy.js` |
| RF-M1.2 Iniciar sesión | CP-006 a CP-009 | `RF-M1.2_Iniciar_sesion.cy.js` |
| RF-M1.3 Recuperar contraseña | CP-010 a CP-013 | `RF-M1.3_Recuperar_contrasena.cy.js` |
| RF-M1.4 Editar perfil propio | CP-014 a CP-018 | `RF-M1.4_Editar_perfil.cy.js` |
| RF-M1.5 Consultar usuarios | CP-019 a CP-023 | `RF-M1.5_Consultar_usuarios.cy.js` |
| RF-M1.6 Eliminar cuenta | CP-024 a CP-027 | `RF-M1.6_Eliminar_cuenta.cy.js` |
| RF-M1.7 Cerrar sesión | CP-028, CP-029 | `RF-M1.7_Cerrar_sesion.cy.js` |
| RF-M1.8 Carga masiva | CP-030 a CP-033 | `RF-M1.8_Carga_masiva.cy.js` |
| RF-M1.9 Registrar por personal interno | CP-034 a CP-040 | `RF-M1.9_Registrar_usuario_personal.cy.js` |
| RF-M2.1 Registrar repuesto | CP-046 a CP-048 | `Repuestos/RF-M2.1_Registrar_repuesto.cy.js` |
| RF-M2.2 Consultar repuestos | CP-049 a CP-052 | `Repuestos/RF-M2.2_Consultar_repuestos.cy.js` |
| RF-M2.3 Editar repuesto | CP-053, CP-054 | `Repuestos/RF-M2.3_Editar_repuesto.cy.js` |
| RF-M2.4 Eliminar repuesto | CP-055 a CP-057 | `Repuestos/RF-M2.4_Eliminar_repuesto.cy.js` |
| RF-M3.1 Registrar historial | CP-066 a CP-070 | `Servicio/RF-M3.1_Registrar_historial.cy.js` |
| RF-M3.2 Consultar historial | CP-071 a CP-075 | `Servicio/RF-M3.2_Consultar_historial.cy.js` |
| RF-M3.3 Modificar historial | CP-076 a CP-080 | `Servicio/RF-M3.3_Modificar_historial.cy.js` |
| RF-M3.4 Asignar técnico | CP-081 a CP-084 | `Servicio/RF-M3.4_Asignar_tecnico.cy.js` |
| RF-M3.5 Eliminar historial | CP-085 a CP-088 | `Servicio/RF-M3.5_Eliminar_historial.cy.js` |
| RF-M3.6 Generar documentación | CP-089 a CP-091 | `Servicio/RF-M3.6_Generar_documentacion.cy.js` |
| RF-M4.1 Registrar motocicleta | CP-096 a CP-098 | `Motos/RF-M4.1_Registrar_motocicleta.cy.js` |
| RF-M4.2 Consultar motocicleta | CP-099 a CP-102 | `Motos/RF-M4.2_Consultar_motocicleta.cy.js` |
| RF-M4.3 Actualizar motocicleta | CP-103, CP-104 | `Motos/RF-M4.3_Actualizar_motocicleta.cy.js` |
| RF-M4.4 Eliminar motocicleta | CP-105, CP-106 | `Motos/RF-M4.4_Eliminar_motocicleta.cy.js` |
| RF-M5.1 Registrar distribuidor | CP-069, CP-070 | `Distribuidores/RF-M5.1_Registrar_distribuidor.cy.js` |
| RF-M5.2 Consultar distribuidores | CP-071, CP-072 | `Distribuidores/RF-M5.2_Consultar_distribuidores.cy.js` |
| RF-M5.3 Editar distribuidor | CP-073 | `Distribuidores/RF-M5.3_Editar_distribuidor.cy.js` |
| RF-M5.4 Eliminar distribuidor | CP-074 | `Distribuidores/RF-M5.4_Eliminar_distribuidor.cy.js` |
| RF-M5.5 Gestionar repuestos por distribuidor | CP-075, CP-076 | `Distribuidores/RF-M5.5_Gestionar_repuestos_distribuidor.cy.js` |
| RF-M6.1 Registrar entrada | CP-077, CP-078 | `Entradas/RF-M6.1_Registrar_entrada.cy.js` |
| RF-M6.2 Consultar entradas | CP-080 | `Entradas/RF-M6.2_Consultar_entradas.cy.js` |
| RF-M6.3 Editar entrada | CP-081 | `Entradas/RF-M6.3_Editar_entrada.cy.js` |
| RF-M6.4 Eliminar entrada | CP-082 | `Entradas/RF-M6.4_Eliminar_entrada.cy.js` |
| RF-M7.1 Registrar rol | CP-083 | `Roles/RF-M7.1_Registrar_rol.cy.js` |
| RF-M7.2 Consultar roles | CP-084 | `Roles/RF-M7.2_Consultar_roles.cy.js` |
| RF-M7.3 Editar rol | CP-085 | `Roles/RF-M7.3_Editar_rol.cy.js` |
| RF-M7.4 Eliminar rol | CP-086 a CP-088 | `Roles/RF-M7.4_Eliminar_rol.cy.js` |
| RF-M8.1 Consultar técnicos | CP-089, CP-090 | `Tecnicos/RF-M8.1_Consultar_tecnicos.cy.js` |
| RF-M8.2 Editar técnico | CP-091 | `Tecnicos/RF-M8.2_Editar_tecnico.cy.js` |
| RF-M8.3 Eliminar técnico | CP-092, CP-093 | `Tecnicos/RF-M8.3_Eliminar_tecnico.cy.js` |

**Sobre los códigos repetidos.** En el documento de Casos de Prueba la
numeración vuelve a empezar en el módulo 5: CP-069 a CP-093 aparecen dos
veces, una en los módulos 3 y otra en los módulos 5 a 8. Los casos son
distintos, pero el código es el mismo. Para poder leer el informe de las
pruebas sin confundirlos, los de los módulos 5, 6, 7 y 8 llevan el módulo al lado:
`CP-077 (M6) — Registrar entrada`. Si más adelante se renumeran los casos,
basta con quitar esa marca del nombre de cada prueba.

La suite cubre los 39 requerimientos funcionales y los 113 casos de prueba
del documento.
