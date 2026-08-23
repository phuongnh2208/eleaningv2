-- DropForeignKey
ALTER TABLE `enrollments` DROP FOREIGN KEY `enrollments_userId_fkey`;

-- DropIndex
DROP INDEX `enrollments_userId_courseId_key` ON `enrollments`;

-- AlterTable
ALTER TABLE `enrollments` ADD COLUMN `contactEmail` VARCHAR(191) NULL,
    ADD COLUMN `contactName` VARCHAR(191) NULL,
    ADD COLUMN `contactPhone` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `enrollments_contactEmail_status_idx` ON `enrollments`(`contactEmail`, `status`);

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
