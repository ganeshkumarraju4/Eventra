CREATE TABLE `EventFeedback` (
    `id` VARCHAR(36) NOT NULL,
    `eventId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventFeedback_eventId_userId_key`(`eventId`, `userId`),
    INDEX `EventFeedback_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EventFeedback` ADD CONSTRAINT `EventFeedback_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `EventFeedback` ADD CONSTRAINT `EventFeedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
