-- CreateTable
CREATE TABLE `sedes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `ciudad` VARCHAR(60) NOT NULL,
    `direccion` VARCHAR(150) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sede_id` INTEGER NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bloques_sede_id_codigo_key`(`sede_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `espacios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bloque_id` INTEGER NOT NULL,
    `identificador` VARCHAR(30) NOT NULL,
    `tipo` ENUM('AULA', 'LABORATORIO', 'AUDITORIO', 'DEPORTIVO', 'SALA_COMPUTO') NOT NULL,
    `capacidad` INTEGER NOT NULL,
    `piso` INTEGER NULL,
    `ubicacion_detalle` VARCHAR(200) NULL,
    `permite_reserva_directa` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('ACTIVO', 'EN_MANTENIMIENTO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    INDEX `espacios_tipo_estado_capacidad_idx`(`tipo`, `estado`, `capacidad`),
    UNIQUE INDEX `espacios_bloque_id_identificador_key`(`bloque_id`, `identificador`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `espacio_id` INTEGER NOT NULL,
    `codigo` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `categoria` ENUM('TECNOLOGIA', 'MOBILIARIO', 'DEPORTIVO', 'DIDACTICO') NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `estado` ENUM('OPTIMO', 'REGULAR', 'DANADO', 'DE_BAJA') NOT NULL DEFAULT 'OPTIMO',
    `es_critico` BOOLEAN NOT NULL DEFAULT false,
    `descripcion` VARCHAR(255) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    INDEX `items_inventario_categoria_estado_idx`(`categoria`, `estado`),
    UNIQUE INDEX `items_inventario_espacio_id_codigo_key`(`espacio_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodos_academicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(10) NOT NULL,
    `fecha_inicio` DATE NOT NULL,
    `fecha_fin` DATE NOT NULL,
    `estado` ENUM('PLANIFICACION', 'ACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'PLANIFICACION',
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `periodos_academicos_codigo_key`(`codigo`),
    INDEX `periodos_academicos_estado_fecha_inicio_fecha_fin_idx`(`estado`, `fecha_inicio`, `fecha_fin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clases_fijas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `espacio_id` INTEGER NOT NULL,
    `periodo_id` INTEGER NOT NULL,
    `dia_semana` TINYINT NOT NULL,
    `hora_inicio` VARCHAR(5) NOT NULL,
    `hora_fin` VARCHAR(5) NOT NULL,
    `asignatura` VARCHAR(100) NOT NULL,
    `docente` VARCHAR(100) NOT NULL,
    `grupo` VARCHAR(20) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clases_fijas_espacio_id_periodo_id_dia_semana_hora_inicio_ho_idx`(`espacio_id`, `periodo_id`, `dia_semana`, `hora_inicio`, `hora_fin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre_completo` VARCHAR(100) NOT NULL,
    `documento_identidad` VARCHAR(20) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `rol` ENUM('ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'GESTOR_ESPACIO', 'SUPERADMIN') NOT NULL DEFAULT 'ESTUDIANTE',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `inhabilitado_para_reservar` BOOLEAN NOT NULL DEFAULT false,
    `motivo_inhabilitacion` VARCHAR(255) NULL,
    `refresh_token_hash` VARCHAR(255) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_email_rol_activo_idx`(`email`, `rol`, `activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `espacio_id` INTEGER NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(300) NOT NULL,
    `cantidad_asistentes_estimada` INTEGER NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'EN_USO', 'FINALIZADA') NOT NULL DEFAULT 'PENDIENTE',
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    INDEX `reservas_espacio_id_estado_fecha_inicio_fecha_fin_idx`(`espacio_id`, `estado`, `fecha_inicio`, `fecha_fin`),
    INDEX `reservas_usuario_id_estado_idx`(`usuario_id`, `estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aprobaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reserva_id` INTEGER NOT NULL,
    `aprobador_id` INTEGER NOT NULL,
    `estado` ENUM('APROBADA', 'RECHAZADA') NOT NULL,
    `observaciones` VARCHAR(300) NULL,
    `fecha_accion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `aprobaciones_reserva_id_aprobador_id_idx`(`reserva_id`, `aprobador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificaciones_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reserva_id` INTEGER NOT NULL,
    `usuario_verificador_id` INTEGER NOT NULL,
    `tipo` ENUM('CHECK_IN', 'CHECK_OUT') NOT NULL,
    `estado_general` ENUM('CONFORME', 'NO_CONFORME', 'CON_NOVEDADES') NOT NULL DEFAULT 'CONFORME',
    `observaciones` TEXT NULL,
    `fecha_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verificaciones_inventario_reserva_id_tipo_idx`(`reserva_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_verificacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `verificacion_id` INTEGER NOT NULL,
    `item_inventario_id` INTEGER NOT NULL,
    `estado_item` ENUM('PRESENTE_OPTIMO', 'PRESENTE_DANADO', 'FALTANTE') NOT NULL,
    `cantidad_encontrada` INTEGER NOT NULL,
    `observacion_novedad` VARCHAR(300) NULL,

    INDEX `detalles_verificacion_verificacion_id_item_inventario_id_idx`(`verificacion_id`, `item_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `accion` VARCHAR(100) NOT NULL,
    `entidad` VARCHAR(50) NOT NULL,
    `entidad_id` INTEGER NOT NULL,
    `detalles` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditorias_entidad_entidad_id_idx`(`entidad`, `entidad_id`),
    INDEX `auditorias_creado_en_idx`(`creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bloques` ADD CONSTRAINT `bloques_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `espacios` ADD CONSTRAINT `espacios_bloque_id_fkey` FOREIGN KEY (`bloque_id`) REFERENCES `bloques`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_inventario` ADD CONSTRAINT `items_inventario_espacio_id_fkey` FOREIGN KEY (`espacio_id`) REFERENCES `espacios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clases_fijas` ADD CONSTRAINT `clases_fijas_espacio_id_fkey` FOREIGN KEY (`espacio_id`) REFERENCES `espacios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clases_fijas` ADD CONSTRAINT `clases_fijas_periodo_id_fkey` FOREIGN KEY (`periodo_id`) REFERENCES `periodos_academicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_espacio_id_fkey` FOREIGN KEY (`espacio_id`) REFERENCES `espacios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprobaciones` ADD CONSTRAINT `aprobaciones_reserva_id_fkey` FOREIGN KEY (`reserva_id`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aprobaciones` ADD CONSTRAINT `aprobaciones_aprobador_id_fkey` FOREIGN KEY (`aprobador_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verificaciones_inventario` ADD CONSTRAINT `verificaciones_inventario_reserva_id_fkey` FOREIGN KEY (`reserva_id`) REFERENCES `reservas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verificaciones_inventario` ADD CONSTRAINT `verificaciones_inventario_usuario_verificador_id_fkey` FOREIGN KEY (`usuario_verificador_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_verificacion` ADD CONSTRAINT `detalles_verificacion_verificacion_id_fkey` FOREIGN KEY (`verificacion_id`) REFERENCES `verificaciones_inventario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_verificacion` ADD CONSTRAINT `detalles_verificacion_item_inventario_id_fkey` FOREIGN KEY (`item_inventario_id`) REFERENCES `items_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditorias` ADD CONSTRAINT `auditorias_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
