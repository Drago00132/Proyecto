-- =============================================================================
--  SIGAT - Datos de prueba para las pruebas automatizadas (Cypress)
-- =============================================================================
--  EJECUTAR SOLO CONTRA LA BASE LOCAL DE PRUEBAS (por defecto: sigat_pruebas).
--  Nunca contra la base de produccion en Aiven: estas pruebas crean, editan
--  y borran registros.
--
--  Uso:
--     mysql -u root -p sigat_pruebas < cypress/seed/datos_de_prueba.sql
--
--  La contrasena de todos los usuarios de prueba es:  Sigat2026!
--  (el hash de abajo corresponde a esa contrasena con bcrypt, 10 rondas)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --- Roles base -------------------------------------------------------------
INSERT INTO roles (id_rol, rol) VALUES
    (1,  'administrador'),
    (2,  'tecnico'),
    (3,  'cliente'),
    (16, 'Recepcionista'),
    (17, 'super admin')
ON DUPLICATE KEY UPDATE rol = VALUES(rol);

-- --- Usuarios de prueba (uno por rol) ---------------------------------------
--  Se borran primero para que cada corrida parta del mismo estado.
DELETE FROM usuarios WHERE numero_identidad IN
    ('1900000001','1900000003','1900000002','1900000010','1900000011','1900000016','1900000017','1900000099');

INSERT INTO usuarios
    (numero_identidad, tipo_documento, nombre, apellido, fecha_nacimiento,
     numero_celular, correo_electronico, contrasena, id_rol)
VALUES
    ('1900000001','Cedula de Ciudadania','Camila','Pruebas','1995-03-10',
     '3001110001','cliente.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 3),

    ('1900000003','Cedula de Ciudadania','Mateo','Pruebas','1996-06-08',
     '3001110003','cliente2.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 3),

    ('1900000002','Cedula de Ciudadania','Tomas','Pruebas','1992-07-22',
     '3001110002','tecnico.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 2),

    ('1900000016','Cedula de Ciudadania','Rosa','Pruebas','1990-01-15',
     '3001110016','recepcion.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 16),

    ('1900000010','Cedula de Ciudadania','Andres','Pruebas','1988-05-05',
     '3001110010','admin.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 1),

    ('1900000011','Cedula de Ciudadania','Beatriz','Pruebas','1987-09-19',
     '3001110011','admin2.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 1),

    ('1900000017','Cedula de Ciudadania','Sofia','Pruebas','1985-11-30',
     '3001110017','superadmin.pruebas@gmail.com',
     '$2b$10$jbLETuNa/2S7jKfWFzIS3eykE0AL4e0ZXGAyJ6WpXuVnmJPYyBamq', 17);

-- --- Ficha de tecnico para el usuario Tecnico -------------------------------
DELETE FROM tecnico WHERE numero_identidad = '1900000002';
INSERT INTO tecnico (numero_identidad, reparaciones_asignadas)
VALUES ('1900000002', 0);

-- --- Motos de prueba del Cliente --------------------------------------------
--  Primero se borran los servicios (historial) de esas motos, porque el
--  historial depende de la moto; despues ya se pueden borrar las motos.
DELETE rh FROM repuestos_historial rh
    JOIN historial h ON rh.id_historial = h.id_historial
    JOIN motos m ON h.id_motos = m.id_motos
    WHERE m.placa IN ('PRB001','PRB002','PRB003');
DELETE h FROM historial h
    JOIN motos m ON h.id_motos = m.id_motos
    WHERE m.placa IN ('PRB001','PRB002','PRB003');

DELETE FROM motos WHERE placa IN ('PRB001','PRB002','PRB003');
INSERT INTO motos (numero_identidad, marca_moto, modelo_moto, placa) VALUES
    ('1900000001','Yamaha','FZ 150','PRB001'),
    ('1900000001','Honda','CB 190','PRB002'),
    ('1900000003','Suzuki','Gixxer 150','PRB003');

-- --- Distribuidor y repuestos de prueba -------------------------------------
DELETE FROM repuestos WHERE nombre_repuesto IN ('Bujia de prueba','Filtro de prueba');
INSERT INTO repuestos (nombre_repuesto, cantidad) VALUES
    ('Bujia de prueba', 25),
    ('Filtro de prueba', 10);

DELETE FROM distribuidores WHERE nombre_distribuidor = 'Distribuidora de prueba';
INSERT INTO distribuidores (nombre_distribuidor, telefono, correo, direccion, contacto)
VALUES ('Distribuidora de prueba','3009998888','distribuidora.pruebas@gmail.com','Calle 1 # 2-3','Contacto Pruebas');

SET FOREIGN_KEY_CHECKS = 1;

-- --- Comprobacion rapida ----------------------------------------------------
SELECT numero_identidad, nombre, correo_electronico, id_rol
FROM usuarios
WHERE correo_electronico LIKE '%.pruebas@gmail.com'
ORDER BY id_rol;
