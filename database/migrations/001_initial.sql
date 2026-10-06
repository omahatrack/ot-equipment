CREATE TABLE IF NOT EXISTS `_AppMigration` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `_AppMigration_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Location` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE KEY `Location_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `roleId` INT NOT NULL,
  `locationId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE KEY `User_username_key` (`username`),
  KEY `User_roleId_idx` (`roleId`), KEY `User_locationId_idx` (`locationId`),
  CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `User_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EquipmentType` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `EquipmentType_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Equipment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NULL,
  `equipmentTypeId` INT NULL,
  `locationId` INT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `currentHours` DOUBLE NOT NULL DEFAULT 0,
  `qrCode` VARCHAR(191) NOT NULL,
  `imagePath` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE KEY `Equipment_code_key` (`code`), UNIQUE KEY `Equipment_qrCode_key` (`qrCode`),
  KEY `Equipment_equipmentTypeId_idx` (`equipmentTypeId`), KEY `Equipment_locationId_idx` (`locationId`),
  CONSTRAINT `Equipment_equipmentTypeId_fkey` FOREIGN KEY (`equipmentTypeId`) REFERENCES `EquipmentType` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Equipment_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MachineHoursLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NOT NULL,
  `hours` DOUBLE NOT NULL,
  `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` INT NULL,
  PRIMARY KEY (`id`), KEY `MachineHoursLog_equipmentId_idx` (`equipmentId`), KEY `MachineHoursLog_userId_idx` (`userId`),
  CONSTRAINT `MachineHoursLog_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `MachineHoursLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Part` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `internalPartNumber` VARCHAR(191) NOT NULL,
  `unitOfMeasure` VARCHAR(191) NOT NULL DEFAULT 'each',
  `binLocation` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), UNIQUE KEY `Part_internalPartNumber_key` (`internalPartNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PartCrossReference` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `partId` INT NOT NULL,
  `number` VARCHAR(191) NOT NULL,
  `brand` VARCHAR(191) NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'aftermarket',
  `isPreferred` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`), UNIQUE KEY `PartCrossReference_partId_number_key` (`partId`,`number`),
  CONSTRAINT `PartCrossReference_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EquipmentPart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NOT NULL,
  `partId` INT NOT NULL,
  `partRole` VARCHAR(191) NULL,
  `qtyRequired` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`), UNIQUE KEY `EquipmentPart_equipmentId_partId_partRole_key` (`equipmentId`,`partId`,`partRole`),
  KEY `EquipmentPart_partId_idx` (`partId`),
  CONSTRAINT `EquipmentPart_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `EquipmentPart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PartLocationInventory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `partId` INT NOT NULL,
  `locationId` INT NOT NULL,
  `onHand` INT NOT NULL DEFAULT 0,
  `keepOnHand` INT NOT NULL DEFAULT 1,
  `reorderWhenBelow` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(191) NOT NULL DEFAULT 'on_hand',
  PRIMARY KEY (`id`), UNIQUE KEY `PartLocationInventory_partId_locationId_key` (`partId`,`locationId`),
  KEY `PartLocationInventory_locationId_idx` (`locationId`),
  CONSTRAINT `PartLocationInventory_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PartLocationInventory_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Vendor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `contactInfo` TEXT NULL,
  `leadTimeDays` INT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `Vendor_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `VendorPart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vendorId` INT NOT NULL,
  `partId` INT NOT NULL,
  `vendorPartNumber` VARCHAR(191) NULL,
  `price` DOUBLE NULL,
  `lastPriceUpdate` DATETIME(3) NULL,
  `purchaseUrl` VARCHAR(1000) NULL,
  `isPreferred` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`), UNIQUE KEY `VendorPart_vendorId_partId_key` (`vendorId`,`partId`),
  KEY `VendorPart_partId_idx` (`partId`),
  CONSTRAINT `VendorPart_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `VendorPart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServiceInterval` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NULL,
  `equipmentTypeId` INT NULL,
  `description` VARCHAR(191) NOT NULL,
  `hoursValue` INT NULL,
  `daysValue` INT NULL,
  `lastServiceHours` DOUBLE NULL,
  `lastServiceDate` DATETIME(3) NULL,
  PRIMARY KEY (`id`), KEY `ServiceInterval_equipmentId_idx` (`equipmentId`), KEY `ServiceInterval_equipmentTypeId_idx` (`equipmentTypeId`),
  CONSTRAINT `ServiceInterval_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ServiceInterval_equipmentTypeId_fkey` FOREIGN KEY (`equipmentTypeId`) REFERENCES `EquipmentType` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServiceRecord` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NOT NULL,
  `intervalId` INT NULL,
  `performedById` INT NOT NULL,
  `hoursAtService` DOUBLE NOT NULL,
  `serviceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  PRIMARY KEY (`id`), KEY `ServiceRecord_equipmentId_idx` (`equipmentId`), KEY `ServiceRecord_intervalId_idx` (`intervalId`), KEY `ServiceRecord_performedById_idx` (`performedById`),
  CONSTRAINT `ServiceRecord_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ServiceRecord_intervalId_fkey` FOREIGN KEY (`intervalId`) REFERENCES `ServiceInterval` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ServiceRecord_performedById_fkey` FOREIGN KEY (`performedById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `InventoryTransaction` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `partId` INT NOT NULL,
  `locationId` INT NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `qtyDelta` INT NOT NULL,
  `userId` INT NULL,
  `equipmentId` INT NULL,
  `vendorId` INT NULL,
  `cost` DOUBLE NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), KEY `InventoryTransaction_partId_idx` (`partId`), KEY `InventoryTransaction_locationId_idx` (`locationId`), KEY `InventoryTransaction_userId_idx` (`userId`), KEY `InventoryTransaction_equipmentId_idx` (`equipmentId`), KEY `InventoryTransaction_vendorId_idx` (`vendorId`),
  CONSTRAINT `InventoryTransaction_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `InventoryTransaction_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `InventoryTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `InventoryTransaction_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `InventoryTransaction_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ServicePartUsed` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `serviceRecordId` INT NOT NULL,
  `partId` INT NOT NULL,
  `transactionId` INT NULL,
  PRIMARY KEY (`id`), KEY `ServicePartUsed_serviceRecordId_idx` (`serviceRecordId`), KEY `ServicePartUsed_partId_idx` (`partId`), KEY `ServicePartUsed_transactionId_idx` (`transactionId`),
  CONSTRAINT `ServicePartUsed_serviceRecordId_fkey` FOREIGN KEY (`serviceRecordId`) REFERENCES `ServiceRecord` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ServicePartUsed_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ServicePartUsed_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `InventoryTransaction` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Note` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `equipmentId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`), KEY `Note_equipmentId_idx` (`equipmentId`),
  CONSTRAINT `Note_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
