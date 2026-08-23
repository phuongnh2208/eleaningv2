import { ConfigService } from '@nestjs/config';
import { DriveAccessService } from './drive-access.service';

const mockPermissionsCreate = jest.fn();
const mockPermissionsList = jest.fn();
const mockPermissionsDelete = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    auth: { GoogleAuth: jest.fn().mockImplementation(() => ({})) },
    drive: jest.fn().mockImplementation(() => ({
      permissions: {
        create: mockPermissionsCreate,
        list: mockPermissionsList,
        delete: mockPermissionsDelete,
      },
    })),
  },
}));

describe('DriveAccessService', () => {
  const makeConfig = (values: Record<string, string | undefined>) =>
    ({ get: (key: string) => values[key] }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips granting access when GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not configured', async () => {
    const service = new DriveAccessService(makeConfig({}));

    await service.grantAccess('file-1', 'student@gmail.com');

    expect(mockPermissionsCreate).not.toHaveBeenCalled();
  });

  it('grants reader access to the given email when configured', async () => {
    mockPermissionsCreate.mockResolvedValue({});
    const service = new DriveAccessService(
      makeConfig({ GOOGLE_SERVICE_ACCOUNT_KEY_PATH: '/tmp/key.json' }),
    );

    await service.grantAccess('file-1', 'student@gmail.com');

    expect(mockPermissionsCreate).toHaveBeenCalledWith({
      fileId: 'file-1',
      sendNotificationEmail: false,
      requestBody: {
        type: 'user',
        role: 'reader',
        emailAddress: 'student@gmail.com',
      },
    });
  });

  it('does not throw when the Drive API call fails', async () => {
    mockPermissionsCreate.mockRejectedValue(new Error('network down'));
    const service = new DriveAccessService(
      makeConfig({ GOOGLE_SERVICE_ACCOUNT_KEY_PATH: '/tmp/key.json' }),
    );

    await expect(
      service.grantAccess('file-1', 'student@gmail.com'),
    ).resolves.toBeUndefined();
  });
});
