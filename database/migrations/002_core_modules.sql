CREATE TABLE IF NOT EXISTS `EquipmentPhoto` (
  `equipmentId` INT NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `fileName` VARCHAR(255) NULL,
  `data` LONGBLOB NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`equipmentId`),
  CONSTRAINT `EquipmentPhoto_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserAccessSettings` (
  `userId` INT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`),
  CONSTRAINT `UserAccessSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserLocationAccess` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `locationId` INT NOT NULL,
  `roleId` INT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserLocationAccess_user_location_key` (`userId`,`locationId`),
  KEY `UserLocationAccess_location_idx` (`locationId`),
  KEY `UserLocationAccess_role_idx` (`roleId`),
  CONSTRAINT `UserLocationAccess_user_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserLocationAccess_location_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserLocationAccess_role_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `VendorPriceHistory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `vendorPartId` INT NOT NULL,
  `price` DOUBLE NOT NULL,
  `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `recordedById` INT NULL,
  PRIMARY KEY (`id`),
  KEY `VendorPriceHistory_vendorPart_idx` (`vendorPartId`),
  CONSTRAINT `VendorPriceHistory_vendorPart_fkey` FOREIGN KEY (`vendorPartId`) REFERENCES `VendorPart` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `VendorPriceHistory_user_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `UserAccessSettings` (`userId`,`isActive`)
SELECT `id`, TRUE FROM `User`;

INSERT IGNORE INTO `UserLocationAccess` (`userId`,`locationId`,`roleId`,`isActive`)
SELECT `id`,`locationId`,`roleId`,TRUE FROM `User` WHERE `locationId` IS NOT NULL;
