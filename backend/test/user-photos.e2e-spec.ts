import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { pngPhotoBytes } from '@/users/testing/photo-fixtures';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const MISSING_ID = '00000000-0000-0000-0000-000000000000';

jest.setTimeout(30000);

describe('User photos (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let student: TestUser;
  let otherStudent: TestUser;
  let tutor: TestUser;

  const photoPath = (userId: string) => `/usuarios/${userId}/foto`;

  const storePhotoFor = async (userId: string): Promise<void> => {
    await dataSource.query(
      `INSERT INTO user_photos (user_id, content, mime_type) VALUES ($1, $2, 'image/png');`,
      [userId, pngPhotoBytes()],
    );
  };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    student = await insertUser(app, dataSource, '20240001@discente.uefs.br', UserType.STUDENT);
    otherStudent = await insertUser(app, dataSource, '20240002@discente.uefs.br', UserType.STUDENT);
    tutor = await insertUser(app, dataSource, 'carlos@uefs.br');
    await storePhotoFor(student.id);
  });

  it('serves the stored bytes with their content type', async () => {
    const response = await api(app, student).get(photoPath(student.id)).expect(200);

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['cache-control']).toBe('private, max-age=3600');
    expect(Buffer.from(response.body as Buffer).equals(pngPhotoBytes())).toBe(true);
  });

  it('lets a tutor see the photo of a student', async () => {
    await api(app, tutor).get(photoPath(student.id)).expect(200);
  });

  it('does not let a student see the photo of another student', async () => {
    const response = await api(app, otherStudent).get(photoPath(student.id)).expect(403);

    expect((response.body as { message: string }).message).toBe(
      'Apenas professores podem ver a foto de outros usuários.',
    );
  });

  it('requires authentication', async () => {
    await api(app).get(photoPath(student.id)).expect(401);
  });

  it('answers 404 for a user without photo', async () => {
    await api(app, tutor).get(photoPath(otherStudent.id)).expect(404);
    await api(app, tutor).get(photoPath(MISSING_ID)).expect(404);
  });

  it('rejects an id that is not a UUID', async () => {
    await api(app, tutor).get(photoPath('abc')).expect(400);
  });
});
