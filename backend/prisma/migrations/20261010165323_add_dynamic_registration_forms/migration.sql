-- CreateTable
CREATE TABLE `RegistrationField` (
    `id` VARCHAR(36) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `fieldType` ENUM('TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'URL', 'DATE', 'SELECT', 'CHECKBOX', 'TEXTAREA') NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `placeholder` VARCHAR(191) NULL,
    `options` JSON NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RegistrationAnswer` (
    `id` VARCHAR(36) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `fieldId` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RegistrationAnswer_registrationId_fieldId_key`(`registrationId`, `fieldId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RegistrationField` ADD CONSTRAINT `RegistrationField_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistrationAnswer` ADD CONSTRAINT `RegistrationAnswer_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RegistrationAnswer` ADD CONSTRAINT `RegistrationAnswer_fieldId_fkey` FOREIGN KEY (`fieldId`) REFERENCES `RegistrationField`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
