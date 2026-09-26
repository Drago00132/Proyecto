-- Migración: permitir que Administrador y Súper Administrador cambien su
-- número de identidad desde "Mi perfil".
--
-- usuarios.numero_identidad es la llave primaria y estas tres tablas apuntan
-- a ella. Sin ON UPDATE CASCADE, MySQL rechaza el cambio en cuanto el usuario
-- tiene motos, entradas de repuestos o ficha de técnico. Con este script el
-- número nuevo se copia solo a esas tablas.
--
-- Se ejecuta UNA sola vez por cada base de datos (la local de XAMPP y la de
-- producción que usa el backend en Render). No borra ni cambia datos.
--
-- repuestos_auditoria.usuario_responsable no es llave foránea y se deja como
-- está a propósito: la auditoría conserva el número que tenía el usuario en el
-- momento de cada acción.

START TRANSACTION;

ALTER TABLE `entrada_repuestos`
  DROP FOREIGN KEY `entrada_repuestos_ibfk_3`;
ALTER TABLE `entrada_repuestos`
  ADD CONSTRAINT `entrada_repuestos_ibfk_3` FOREIGN KEY (`numero_identidad`)
  REFERENCES `usuarios` (`numero_identidad`) ON UPDATE CASCADE;

ALTER TABLE `motos`
  DROP FOREIGN KEY `motos_ibfk_1`;
ALTER TABLE `motos`
  ADD CONSTRAINT `motos_ibfk_1` FOREIGN KEY (`numero_identidad`)
  REFERENCES `usuarios` (`numero_identidad`) ON UPDATE CASCADE;

-- Se conserva el ON DELETE CASCADE que ya tenía.
ALTER TABLE `tecnico`
  DROP FOREIGN KEY `tecnico_ibfk_1`;
ALTER TABLE `tecnico`
  ADD CONSTRAINT `tecnico_ibfk_1` FOREIGN KEY (`numero_identidad`)
  REFERENCES `usuarios` (`numero_identidad`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
