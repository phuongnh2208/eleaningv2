import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';

/**
 * Grants/revokes real Google Drive file permissions via a service account,
 * mirroring the reference demo (phuongnh2208/google-drive-video-demo). This
 * is additive to VideoAccessGuard, not a replacement: the backend guard is
 * still the source of truth for whether an API caller may see an embedUrl at
 * all. This service only makes the underlying Drive file itself viewable by
 * a specific Google account, which is required when a Drive file is kept
 * "Restricted" instead of "Anyone with the link".
 *
 * Requires GOOGLE_SERVICE_ACCOUNT_KEY_PATH pointing at a service-account JSON
 * key, and the target Drive files/folders must be shared with that service
 * account's email (as Editor) so it has permission to manage sharing on them.
 * If not configured, grant/revoke calls are logged and skipped rather than
 * failing the caller's request — Drive-level restriction is an optional
 * hardening layer on top of the mandatory backend guard, not a prerequisite.
 */
@Injectable()
export class DriveAccessService {
  private readonly logger = new Logger(DriveAccessService.name);
  private authClient: Auth.GoogleAuth | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH'));
  }

  private getAuth() {
    if (this.authClient) return this.authClient;
    const keyFile = this.config.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
    this.authClient = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return this.authClient;
  }

  async grantAccess(driveFileId: string, email: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `GOOGLE_SERVICE_ACCOUNT_KEY_PATH chưa được cấu hình — bỏ qua cấp quyền Drive cho ${driveFileId}. File phải đang ở chế độ "Anyone with the link" để video còn phát được.`,
      );
      return;
    }

    try {
      const drive = google.drive({ version: 'v3', auth: this.getAuth() });
      await drive.permissions.create({
        fileId: driveFileId,
        sendNotificationEmail: false,
        requestBody: {
          type: 'user',
          role: 'reader',
          emailAddress: email,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already exists')) return;
      this.logger.warn(
        `Cấp quyền Drive thất bại cho file ${driveFileId}: ${message}`,
      );
    }
  }

  /**
   * Lists the video files directly inside a Drive folder, so an admin can
   * paste one folder link (e.g. "Courses 1") and create lessons in bulk
   * instead of copying each file's link one by one. Requires the folder to
   * be shared with the service account (Viewer is enough just to list).
   */
  async listFolderVideoFiles(
    folderId: string,
  ): Promise<{ id: string; name: string }[]> {
    const drive = google.drive({ version: 'v3', auth: this.getAuth() });
    const files: { id: string; name: string }[] = [];
    let pageToken: string | undefined;

    do {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'nextPageToken, files(id, name, mimeType)',
        pageToken,
        orderBy: 'name_natural',
      });

      for (const file of response.data.files ?? []) {
        if (file.id && file.name) {
          files.push({ id: file.id, name: file.name });
        }
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return files;
  }

  async revokeAccess(driveFileId: string, email: string): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      const drive = google.drive({ version: 'v3', auth: this.getAuth() });
      const { data } = await drive.permissions.list({
        fileId: driveFileId,
        fields: 'permissions(id, emailAddress)',
      });
      const permission = data.permissions?.find(
        (p) => p.emailAddress === email,
      );
      if (permission?.id) {
        await drive.permissions.delete({
          fileId: driveFileId,
          permissionId: permission.id,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Thu hồi quyền Drive thất bại cho file ${driveFileId}: ${message}`,
      );
    }
  }
}
