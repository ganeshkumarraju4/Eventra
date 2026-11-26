ALTER TABLE `Event` ADD COLUMN `postEventDescription` TEXT NULL;

CREATE TABLE `EventPostPhoto` (
    `id` VARCHAR(36) NOT NULL,
    `eventId` VARCHAR(36) NOT NULL,
    `url` TEXT NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EventPostPhoto_publicId_key`(`publicId`),
    INDEX `EventPostPhoto_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EventPostPhoto` ADD CONSTRAINT `EventPostPhoto_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
