import { GoogleDriveUrlUtil } from './google-drive-url.util';

describe('GoogleDriveUrlUtil', () => {
  it('parses the /file/d/ID/view form', () => {
    const result = GoogleDriveUrlUtil.parse(
      'https://drive.google.com/file/d/1AbC-XyZ_123/view?usp=sharing',
    );
    expect(result).toEqual({
      driveFileId: '1AbC-XyZ_123',
      embedUrl: 'https://drive.google.com/file/d/1AbC-XyZ_123/preview',
    });
  });

  it('parses the open?id= form', () => {
    const result = GoogleDriveUrlUtil.parse(
      'https://drive.google.com/open?id=1AbC-XyZ_123',
    );
    expect(result).toEqual({
      driveFileId: '1AbC-XyZ_123',
      embedUrl: 'https://drive.google.com/file/d/1AbC-XyZ_123/preview',
    });
  });

  it('parses the uc?id= form', () => {
    const result = GoogleDriveUrlUtil.parse(
      'https://drive.google.com/uc?id=1AbC-XyZ_123&export=download',
    );
    expect(result).toEqual({
      driveFileId: '1AbC-XyZ_123',
      embedUrl: 'https://drive.google.com/file/d/1AbC-XyZ_123/preview',
    });
  });

  it('rejects a non-Google-Drive domain', () => {
    expect(
      GoogleDriveUrlUtil.parse('https://evil.example.com/file/d/1AbC/view'),
    ).toBeNull();
  });

  it('rejects a URL missing a file id', () => {
    expect(
      GoogleDriveUrlUtil.parse('https://drive.google.com/open'),
    ).toBeNull();
  });

  it('rejects an unparsable string', () => {
    expect(GoogleDriveUrlUtil.parse('not a url')).toBeNull();
  });
});
