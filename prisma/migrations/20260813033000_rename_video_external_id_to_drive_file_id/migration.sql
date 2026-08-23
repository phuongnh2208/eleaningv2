-- Rename the Google Drive file identifier column without losing existing video references.
ALTER TABLE `videos`
  CHANGE COLUMN `externalId` `driveFileId` VARCHAR(191) NULL;
