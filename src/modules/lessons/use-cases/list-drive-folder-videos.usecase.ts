import { Injectable } from '@nestjs/common';
import { AppException } from 'src/common/exceptions/app.exception';
import { LessonError } from '../constants/lesson.errors';
import { GoogleDriveUrlUtil } from '../utils/google-drive-url.util';
import { DriveAccessService } from '../services/drive-access.service';

export type DriveFolderVideo = {
  driveFileId: string;
  name: string;
  videoUrl: string;
};

@Injectable()
export class ListDriveFolderVideosUseCase {
  constructor(private readonly driveAccessService: DriveAccessService) {}

  async execute(folderUrl: string): Promise<DriveFolderVideo[]> {
    if (!this.driveAccessService.isConfigured()) {
      throw new AppException(LessonError.DRIVE_NOT_CONFIGURED);
    }

    const folderId = GoogleDriveUrlUtil.parseFolderId(folderUrl);
    if (!folderId) {
      throw new AppException(LessonError.DRIVE_FOLDER_URL_INVALID);
    }

    try {
      const files =
        await this.driveAccessService.listFolderVideoFiles(folderId);
      return files.map((file) => ({
        driveFileId: file.id,
        name: file.name,
        videoUrl: `https://drive.google.com/file/d/${file.id}/view`,
      }));
    } catch {
      throw new AppException(LessonError.DRIVE_FOLDER_UNREADABLE);
    }
  }
}
