/*
  Warnings:

  - You are about to alter the column `value` on the `registrationanswer` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `registrationanswer` MODIFY `value` JSON NOT NULL;
