-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 12-04-2026 a las 19:04:47
-- Versión del servidor: 8.0.45-0ubuntu0.24.04.1
-- Versión de PHP: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sigat`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial`
--

CREATE TABLE `historial` (
  `id_historial` int NOT NULL,
  `id_motos` int NOT NULL,
  `id_tecnico` int NOT NULL,
  `id_historial_cliente` int NOT NULL,
  `descripcion_prodlema` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `estado` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion_trabajo` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `fotos` varchar(250) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial`
--

INSERT INTO `historial` (`id_historial`, `id_motos`, `id_tecnico`, `id_historial_cliente`, `descripcion_prodlema`, `estado`, `descripcion_trabajo`, `fotos`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(2, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(3, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(4, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(5, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(6, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(7, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(8, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(9, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(10, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(24, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30'),
(25, 2, 2, 2, 'cambio', 'm', 'a', NULL, '2025-10-23', '2025-10-30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `motos`
--

CREATE TABLE `motos` (
  `id_motos` int NOT NULL,
  `numero_identidad` int NOT NULL,
  `marca_moto` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `modelo_moto` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `placa` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `motos`
--

INSERT INTO `motos` (`id_motos`, `numero_identidad`, `marca_moto`, `modelo_moto`, `placa`) VALUES
(1, 1039156234, 'KTM', '125 Duke', 'PAC 01'),
(2, 1039156234, 'KTM', '1390 Super Duke R/EVO', 'PAC 02'),
(3, 1039156235, 'kTM', '790 Duke', 'PAC 03'),
(4, 1039156235, 'KTM', '890 Duke/R', 'PAC 04'),
(5, 1039156236, 'KTM', '125 Duke', 'PAC 05'),
(6, 1039156236, 'KTM', '990 Duke', 'PAC 06'),
(7, 1039156236, 'KTM', '125 Duke', 'PAC 07'),
(8, 1039156237, 'KTM', '250 Duke', 'PAC 08'),
(9, 1039156237, 'KTM', '390 Duke', 'PAC 09'),
(10, 1039156237, 'KTM', '1390 Super Duke R/EVO', 'PAC 010'),
(13, 1, 'KTM', '125 Duke', 'PAC 11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `repuestos`
--

CREATE TABLE `repuestos` (
  `id_repuestos` int NOT NULL,
  `nombre_repuesto` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `cantidad` varchar(50) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `repuestos`
--

INSERT INTO `repuestos` (`id_repuestos`, `nombre_repuesto`, `cantidad`) VALUES
(1, 'Líquido de frenos', '10'),
(2, 'filtro de aceite', '20'),
(3, 'suspension', '5'),
(4, 'Transmision', '30'),
(5, 'Tanque de combustible', '2'),
(6, 'Escape', '50'),
(7, 'cadena', '15'),
(8, 'kit de emnbrague', '20'),
(9, 'Filtro de aire', '30'),
(10, 'Discos de freno', '25'),
(11, 'cilindros', '4'),
(13, 'bujías', '30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `repuestos_historial`
--

CREATE TABLE `repuestos_historial` (
  `id_historial` int NOT NULL,
  `id_repuestos` int NOT NULL,
  `cantidad` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `repuestos_historial`
--

INSERT INTO `repuestos_historial` (`id_historial`, `id_repuestos`, `cantidad`) VALUES
(3, 7, 1),
(3, 2, 1),
(3, 3, 1),
(4, 5, 1),
(6, 10, 1),
(7, 3, 1),
(7, 6, 1),
(9, 9, 1),
(10, 3, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int NOT NULL,
  `rol` varchar(20) COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `rol`) VALUES
(1, 'administrador'),
(2, 'tecnico'),
(3, 'cliente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tecnico`
--

CREATE TABLE `tecnico` (
  `id_tecnico` int NOT NULL,
  `numero_identidad` int NOT NULL,
  `reparaciones_asignadas` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tecnico`
--

INSERT INTO `tecnico` (`id_tecnico`, `numero_identidad`, `reparaciones_asignadas`) VALUES
(1, 2, 2),
(2, 2, 5),
(3, 2, 10),
(4, 2, 8),
(5, 2, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `numero_identidad` int NOT NULL,
  `tipo_documento` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `apellido` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `numero_celular` int DEFAULT NULL,
  `correo_electronico` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `contrasena` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `id_rol` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`numero_identidad`, `tipo_documento`, `nombre`, `apellido`, `fecha_nacimiento`, `numero_celular`, `correo_electronico`, `contrasena`, `id_rol`) VALUES
(1, 'Cedula de Ciudadania', '1', '1', '2025-11-30', NULL, '1@gmail', '$2y$12$UnELArhsfPXH9furhFu./umBWpCMn9HCYXbV6iodAfLPyBxvkrXiG', 3),
(2, 'Cedula de Ciudadania', '2', '2', '0000-00-00', 2, '2@gmail.com', '$2y$12$3KL1.EEvr3dAkUvqAw2teeqcO2vBWDpz.1KQQL.B9DuBZS.ZbFhrW', 2),
(4, 'Cedula de Ciudadania', '4', '4', '2026-04-12', 4, '4@gmail.com', '$2b$10$gHJQDjElOb6bVTUjoF2BPOpvpGKIoMBYuvlnK7su7dsfhgvM42s4S', 3),
(33, 'Cedula de Ciudadania', 'marocs', 'gaviria', '2025-11-30', NULL, 'marocs@gmail', '$2b$10$xy72ZjykXRDPObs2R7Rl4eIigw0IRQykJ3Fu50TP8AE5mpgEGOZSi', 1),
(1039156234, 'Cedula de Ciudadania', 'Pablo', 'Hernades', '2025-12-09', NULL, 'Pablo90@gmail.com', '$2y$12$3UARplmAockfiDOTTKzSWut.TyHF9/o3wECSa9PVZRi.J.e6gzvAO', 3),
(1039156235, 'Cedula de Ciudadania', 'Tiran', 'Torres', '2025-12-09', NULL, 'Tiran3312@gamil.com', '$2y$12$PflAifAMSQESSzzoGFLE0.sUzmGJ9GSGjmYQUgPQd2ILEGqBpIEly', 3),
(1039156236, 'Cedula de Ciudadania', 'yerin', 'lagos', '2008-06-09', NULL, 'Yerin78@outlook.es', '$2y$12$/r7Kp2IPImu8nPGq8HvIUubfvpyUe9JmwkSf2E5OsMKQU1RW/pjBS', 3),
(1039156237, 'Cedula de Ciudadania', 'marzo', 'Torres', '2006-05-23', NULL, 'Torres@gmail.com', '$2y$12$.BuOpdYV1q6jqHO2xw6ikeTIxlsPYFC5mHv6nwO7YbVxhMKvVbrRO', 3),
(1039156238, 'Pasaporte', 'Pepe', 'Martines', '2025-12-09', NULL, 'Pepe83@gmail.com', '$2y$12$JvdUo8/H.gfMTCxG3209RuyfCuQPJOzzC85J6/20tSJIUIr7t1/OO', 2),
(1039156240, 'Cedula de Ciudadania', 'Marcos', 'Hernandes', '2025-12-09', NULL, 'Marcos12@gmail.com', '$2y$12$IAGfB6XEOAPL5DtnZhhXi.Bc76WBPVJd0VziKiqM1MZIME/IEbeJa', 3),
(1039156242, 'Cedula de Ciudadania', 'Lopes', 'Gaviria', '2025-12-09', NULL, 'Lopes132@gmail.com', '$2y$12$EgYNE/eeqGOgHNmVj05zCebzjDdwGx9jNojlMvDd7Oq4d4aWlNn/m', 3),
(1039156244, 'Cedula de Ciudadania', 'Sebastian', 'flancos', '2025-12-09', NULL, 'SedasFlancos56@outlook.es', '$2y$12$KjDnjSkoZ91or.ihMQySDe3NvChGFR5sDX/05Xc2kJ0zlj8c6wXOW', 3),
(1039156310, 'Cedula de Ciudadania', 'Maria', 'Herrera', '1992-02-23', NULL, 'Herrera@gmail.com', '$2y$12$nvoCriTzyjGAzOw4EL5FQe5XWam05ngyh1.tf2/ry0jmLufuJKlpC', 1),
(1039156390, 'Cedula de Ciudadania', 'Pablo', 'Garcia', '2025-12-09', NULL, 'Garcia79@gmail.com', '$2y$12$sxItwznEFsN.u646PLtolus3Hh3myN5yaxHln5IL200aSmWJj5ERu', 3);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `historial`
--
ALTER TABLE `historial`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `id_motos` (`id_motos`),
  ADD KEY `id_tecnico` (`id_tecnico`);

--
-- Indices de la tabla `motos`
--
ALTER TABLE `motos`
  ADD PRIMARY KEY (`id_motos`),
  ADD UNIQUE KEY `placa` (`placa`),
  ADD KEY `numero_identidad` (`numero_identidad`);

--
-- Indices de la tabla `repuestos`
--
ALTER TABLE `repuestos`
  ADD PRIMARY KEY (`id_repuestos`);

--
-- Indices de la tabla `repuestos_historial`
--
ALTER TABLE `repuestos_historial`
  ADD KEY `id_historial` (`id_historial`),
  ADD KEY `id_repuestos` (`id_repuestos`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `tecnico`
--
ALTER TABLE `tecnico`
  ADD PRIMARY KEY (`id_tecnico`),
  ADD KEY `numero_identidad` (`numero_identidad`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`numero_identidad`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `historial`
--
ALTER TABLE `historial`
  MODIFY `id_historial` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `motos`
--
ALTER TABLE `motos`
  MODIFY `id_motos` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `repuestos`
--
ALTER TABLE `repuestos`
  MODIFY `id_repuestos` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `tecnico`
--
ALTER TABLE `tecnico`
  MODIFY `id_tecnico` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `historial`
--
ALTER TABLE `historial`
  ADD CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`id_motos`) REFERENCES `motos` (`id_motos`),
  ADD CONSTRAINT `historial_ibfk_2` FOREIGN KEY (`id_tecnico`) REFERENCES `tecnico` (`id_tecnico`);

--
-- Filtros para la tabla `motos`
--
ALTER TABLE `motos`
  ADD CONSTRAINT `motos_ibfk_1` FOREIGN KEY (`numero_identidad`) REFERENCES `usuarios` (`numero_identidad`);

--
-- Filtros para la tabla `repuestos_historial`
--
ALTER TABLE `repuestos_historial`
  ADD CONSTRAINT `repuestos_historial_ibfk_1` FOREIGN KEY (`id_historial`) REFERENCES `historial` (`id_historial`),
  ADD CONSTRAINT `repuestos_historial_ibfk_2` FOREIGN KEY (`id_repuestos`) REFERENCES `repuestos` (`id_repuestos`);

--
-- Filtros para la tabla `tecnico`
--
ALTER TABLE `tecnico`
  ADD CONSTRAINT `tecnico_ibfk_1` FOREIGN KEY (`numero_identidad`) REFERENCES `usuarios` (`numero_identidad`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
