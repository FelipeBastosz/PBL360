import { PgUserPhotoRepository, UPSERT_USER_PHOTO_QUERY } from './pg-user-photo.repository';

describe('PgUserPhotoRepository', () => {
  const photo = {
    userId: 'u1',
    content: Buffer.from('photo'),
    mimeType: 'image/png',
    updatedAt: new Date(),
  };

  it('returns null when a user has no photo and maps a stored photo', async () => {
    const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([photo]);
    const create = jest.fn((row: unknown) => row);
    const repository = new PgUserPhotoRepository({ query, create } as never);

    await expect(repository.findByUserId('u1')).resolves.toBeNull();
    await expect(repository.findByUserId('u1')).resolves.toEqual(photo);
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM user_photos'), ['u1']);
    expect(create).toHaveBeenCalledWith(photo);
  });

  it('upserts photo bytes and deletes by user id', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const repository = new PgUserPhotoRepository({ query, create: jest.fn() } as never);

    await repository.save('u1', photo as never);
    expect(query).toHaveBeenNthCalledWith(1, UPSERT_USER_PHOTO_QUERY, [
      'u1',
      photo.content,
      photo.mimeType,
    ]);
    await repository.deleteByUserId('u1');
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM user_photos'), [
      'u1',
    ]);
  });
});
