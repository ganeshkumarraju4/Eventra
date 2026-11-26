ALTER TABLE `Event`
    ADD COLUMN `coverImageUrl` TEXT NULL,
    ADD COLUMN `coverImagePublicId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Event_coverImagePublicId_key` ON `Event`(`coverImagePublicId`);
