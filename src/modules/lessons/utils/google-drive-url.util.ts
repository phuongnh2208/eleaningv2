const GOOGLE_DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const GOOGLE_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'www.drive.google.com',
  'docs.google.com',
]);

export type GoogleDriveVideoReference = {
  driveFileId: string;
  embedUrl: string;
};

export class GoogleDriveUrlUtil {
  static parseFolderId(value: string): string | null {
    try {
      const url = new URL(value.trim());

      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (!GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;

      const folderPathMatch = url.pathname.match(/\/folders\/([^/?]+)/);
      const folderId = folderPathMatch?.[1] ?? url.searchParams.get('id');

      if (!folderId || !GOOGLE_DRIVE_ID_PATTERN.test(folderId)) return null;

      return folderId;
    } catch {
      return null;
    }
  }

  static parse(value: string): GoogleDriveVideoReference | null {
    try {
      const url = new URL(value.trim());

      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (!GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;

      const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const driveFileId = filePathMatch?.[1] ?? url.searchParams.get('id');

      if (!driveFileId || !GOOGLE_DRIVE_ID_PATTERN.test(driveFileId))
        return null;

      return {
        driveFileId,
        embedUrl: `https://drive.google.com/file/d/${driveFileId}/preview`,
      };
    } catch {
      return null;
    }
  }
}
