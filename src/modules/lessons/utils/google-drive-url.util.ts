const GOOGLE_DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const GOOGLE_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'www.drive.google.com',
  'docs.google.com',
]);

export type GoogleDriveVideoReference = {
  externalId: string;
  embedUrl: string;
};

export class GoogleDriveUrlUtil {
  static parse(value: string): GoogleDriveVideoReference | null {
    try {
      const url = new URL(value.trim());

      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (!GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;

      const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const externalId = filePathMatch?.[1] ?? url.searchParams.get('id');

      if (!externalId || !GOOGLE_DRIVE_ID_PATTERN.test(externalId)) return null;

      return {
        externalId,
        embedUrl: `https://drive.google.com/file/d/${externalId}/preview`,
      };
    } catch {
      return null;
    }
  }
}
