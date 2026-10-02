/*
  Warnings:

  - You are about to drop the column `status` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `booking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_userId_fkey`;

-- DropIndex
DROP INDEX `Booking_userId_fkey` ON `booking`;

-- AlterTable
ALTER TABLE `booking` DROP COLUMN `status`,
    DROP COLUMN `userId`;
