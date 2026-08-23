import { ListDriveFolderVideosUseCase } from './list-drive-folder-videos.usecase';
import { AppException } from 'src/common/exceptions/app.exception';
import { LessonError } from '../constants/lesson.errors';

describe('ListDriveFolderVideosUseCase', () => {
  it('throws DRIVE_NOT_CONFIGURED when the service account is not set up', async () => {
    const driveAccessService = {
      isConfigured: jest.fn().mockReturnValue(false),
      listFolderVideoFiles: jest.fn(),
    };
    const useCase = new ListDriveFolderVideosUseCase(
      driveAccessService as never,
    );

    await expect(
      useCase.execute('https://drive.google.com/drive/folders/abc123'),
    ).rejects.toMatchObject({
      message: LessonError.DRIVE_NOT_CONFIGURED.message,
    });
    expect(driveAccessService.listFolderVideoFiles).not.toHaveBeenCalled();
  });

  it('throws DRIVE_FOLDER_URL_INVALID for a non-folder URL', async () => {
    const driveAccessService = {
      isConfigured: jest.fn().mockReturnValue(true),
      listFolderVideoFiles: jest.fn(),
    };
    const useCase = new ListDriveFolderVideosUseCase(
      driveAccessService as never,
    );

    await expect(
      useCase.execute('https://example.com/not-a-drive-url'),
    ).rejects.toMatchObject({
      message: LessonError.DRIVE_FOLDER_URL_INVALID.message,
    });
  });

  it('returns files with driveFileId/name/videoUrl for a valid folder', async () => {
    const driveAccessService = {
      isConfigured: jest.fn().mockReturnValue(true),
      listFolderVideoFiles: jest
        .fn()
        .mockResolvedValue([{ id: 'file-1', name: 'Lesson 01' }]),
    };
    const useCase = new ListDriveFolderVideosUseCase(
      driveAccessService as never,
    );

    const result = await useCase.execute(
      'https://drive.google.com/drive/folders/abc123?usp=drive_link',
    );

    expect(driveAccessService.listFolderVideoFiles).toHaveBeenCalledWith(
      'abc123',
    );
    expect(result).toEqual([
      {
        driveFileId: 'file-1',
        name: 'Lesson 01',
        videoUrl: 'https://drive.google.com/file/d/file-1/view',
      },
    ]);
  });

  it('wraps a Drive API failure as DRIVE_FOLDER_UNREADABLE', async () => {
    const driveAccessService = {
      isConfigured: jest.fn().mockReturnValue(true),
      listFolderVideoFiles: jest.fn().mockRejectedValue(new Error('403')),
    };
    const useCase = new ListDriveFolderVideosUseCase(
      driveAccessService as never,
    );

    await expect(
      useCase.execute('https://drive.google.com/drive/folders/abc123'),
    ).rejects.toBeInstanceOf(AppException);
  });
});
