CREATE TABLE IF NOT EXISTS `ServiceAttachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `serviceRecordId` INT NOT NULL,
  `displayName` VARCHAR(255) NOT NULL,
  `notes` TEXT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `data` LONGBLOB NOT NULL,
  `uploadedById` INT NULL,
  `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ServiceAttachment_record_idx` (`serviceRecordId`),
  KEY `ServiceAttachment_uploadedBy_idx` (`uploadedById`),
  CONSTRAINT `ServiceAttachment_record_fkey` FOREIGN KEY (`serviceRecordId`) REFERENCES `ServiceRecord` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceAttachment_uploadedBy_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
