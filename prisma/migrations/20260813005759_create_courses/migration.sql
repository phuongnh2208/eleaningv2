-- DropForeignKey
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_userId_fkey`;

-- DropIndex
DROP INDEX `sessions_userId_fkey` ON `sessions`;

-- DropIndex
DROP INDEX `users_email_key` ON `users`;
