ALTER TABLE `User` ADD COLUMN `email` VARCHAR(255) NULL AFTER `username`;
ALTER TABLE `User` ADD COLUMN `passwordChangedAt` DATETIME(3) NULL AFTER `passwordHash`;
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);

ALTER TABLE `ServiceRecord` ADD COLUMN `laborCost` DOUBLE NOT NULL DEFAULT 0 AFTER `notes`;
ALTER TABLE `ServiceRecord` ADD COLUMN `externalCost` DOUBLE NOT NULL DEFAULT 0 AFTER `laborCost`;

CREATE TABLE IF NOT EXISTS `PasswordResetToken` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `tokenHash` VARCHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordResetToken_tokenHash_key` (`tokenHash`),
  KEY `PasswordResetToken_user_idx` (`userId`),
  CONSTRAINT `PasswordResetToken_user_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
