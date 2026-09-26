# Pruebas unitarias de SIGAT

Estas pruebas revisan **cada controlador por separado**, con la base de datos
y los servicios externos simulados. No necesitan base de datos ni backend
levantado: corren solas y en segundos. Lo que comprueban es la lógica de cada
requerimiento — qué valida, qué código de respuesta devuelve, qué le pide al
modelo y con qué datos — sin que nada de fuera pueda hacerlas fallar.

Están organizadas **igual que las pruebas automatizadas** de Cypress: una
carpeta por módulo, **un archivo por requerimiento funcional**, y dentro de
cada archivo **una prueba por cada caso de prueba** del documento.

```
test/unitarias/
  Usuarios/        RF-M1.1 a RF-M1.9
  Repuestos/       RF-M2.1 a RF-M2.4
  Servicio/        RF-M3.1 a RF-M3.5
  Motos/           RF-M4.1 a RF-M4.4
  Distribuidores/  RF-M5.1 a RF-M5.5
  Entradas/        RF-M6.1 a RF-M6.4
  Roles/           RF-M7.1 a RF-M7.4
  Tecnicos/        RF-M8.1 a RF-M8.3
```

Cada archivo se llama por su requerimiento y abre con una cabecera que dice
qué casos cubre, lo mismo que las automatizadas:

```
Usuarios/RF-M1.2_Iniciar_sesion.test.js

    // RF-M1.2 — Iniciar sesión
    // Casos de prueba: CP-006, CP-007, CP-008, CP-009

    describe('RF-M1.2 — Iniciar sesión')
        it('CP-006 — Debería retornar 200 y el token si las credenciales son válidas...')
        it('CP-007 — Debería retornar 401 si el correo no existe')
```

---

## Cómo correrlas

```bash
npm test unitarias                          # todas las unitarias
npm test RF-M1.2                            # solo un requerimiento
npm test Usuarios                           # solo un módulo
npm test                                    # unitarias e integradas
```

Jest filtra por la ruta del archivo, así que sirve el código del
requerimiento, el nombre del módulo o cualquier parte del nombre.

A diferencia de las integradas, **estas no necesitan la base de pruebas**: si
la base no está disponible, las unitarias siguen corriendo igual.

---

## Sobre los códigos repetidos

En el documento de Casos de Prueba la numeración vuelve a empezar en el módulo
5: los códigos CP-069 a CP-093 aparecen dos veces, una en el módulo 3 y otra
en los módulos 5 a 8. Los casos son distintos, pero el código es el mismo. Para
poder leer el informe sin confundirlos, los de los módulos 5, 6, 7 y 8 llevan
el módulo al lado, igual que en las automatizadas:

```
it('CP-077 (M6) — Debería retornar 400 si la cantidad ingresada es negativa')
```

---

## Qué cubren y qué no

De los 113 casos del documento, las unitarias cubren **93**. Los 20 que faltan
no se pueden comprobar a este nivel, porque no viven en el controlador:

| Casos | Dónde viven en realidad |
|---|---|
| CP-005 | La edad mínima se valida en el formulario de la página |
| CP-020 a CP-023 | Permisos de pantalla y paginación de la vista |
| CP-026 | Autoeliminación: es una regla de permisos de ruta |
| CP-028, CP-029 | Cerrar sesión ocurre en el navegador |
| CP-051, CP-052 | Permisos de ruta (middleware), no del controlador |
| CP-056, CP-088, CP-102 | Permisos de ruta por rol |
| CP-069 | El adjunto lo rechaza multer antes de llegar al controlador |
| CP-075, CP-084 | Filtros y búsquedas de la vista |
| CP-089 a CP-091 (M3.6) | El documento PDF se arma en el navegador |
| CP-093 | Lo impide la llave foránea de la base de datos |

Todos ellos **sí están cubiertos** por las pruebas automatizadas de Cypress
(`cypress/e2e/`) o por las integradas (`test/integradas/`), que es donde
corresponde comprobarlos.
