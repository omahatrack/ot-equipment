ALTER TABLE `ServiceAttachment` MODIFY COLUMN `data` LONGBLOB NULL;
ALTER TABLE `ServiceAttachment` ADD COLUMN `documentType` VARCHAR(50) NOT NULL DEFAULT 'Other' AFTER `notes`;
ALTER TABLE `ServiceAttachment` ADD COLUMN `storageProvider` VARCHAR(30) NOT NULL DEFAULT 'database' AFTER `fileName`;
ALTER TABLE `ServiceAttachment` ADD COLUMN `storageBucket` VARCHAR(100) NULL AFTER `storageProvider`;
ALTER TABLE `ServiceAttachment` ADD COLUMN `storagePath` VARCHAR(1000) NULL AFTER `storageBucket`;

CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NULL,
  `locationId` INT NULL,
  `entityType` VARCHAR(80) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `action` VARCHAR(80) NOT NULL,
  `summary` VARCHAR(500) NULL,
  `details` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_user_idx` (`userId`),
  KEY `AuditLog_location_idx` (`locationId`),
  KEY `AuditLog_entity_idx` (`entityType`,`entityId`),
  KEY `AuditLog_created_idx` (`createdAt`),
  CONSTRAINT `AuditLog_user_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AuditLog_location_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `EquipmentPhoto` MODIFY COLUMN `data` LONGBLOB NULL;
ALTER TABLE `EquipmentPhoto` ADD COLUMN `storageProvider` VARCHAR(30) NOT NULL DEFAULT 'database' AFTER `fileName`;
ALTER TABLE `EquipmentPhoto` ADD COLUMN `storageBucket` VARCHAR(100) NULL AFTER `storageProvider`;
ALTER TABLE `EquipmentPhoto` ADD COLUMN `storagePath` VARCHAR(1000) NULL AFTER `storageBucket`;
