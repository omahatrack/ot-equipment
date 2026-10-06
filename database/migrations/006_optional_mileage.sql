ALTER TABLE `Equipment` ADD COLUMN `usesMileage` BOOLEAN NOT NULL DEFAULT FALSE AFTER `currentHours`;
ALTER TABLE `Equipment` ADD COLUMN `currentMileage` DOUBLE NULL AFTER `usesMileage`;
CREATE TABLE IF NOT EXISTS `MachineMileageLog` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `equipmentId` INT NOT NULL,
  `mileage` DOUBLE NOT NULL,
  `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `userId` INT NULL,
  PRIMARY KEY (`id`),
  KEY `MachineMileageLog_equipment_idx` (`equipmentId`),
  KEY `MachineMileageLog_user_idx` (`userId`),
  CONSTRAINT `MachineMileageLog_equipment_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MachineMileageLog_user_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
