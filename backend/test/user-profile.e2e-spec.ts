import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { UserTypePayload } from '@/auth/application/dtos/user-type-payload.enum';
import { jpegPhotoBytes, pngPhotoBytes, webpPhotoBytes } from '@/users/testing/photo-fixtures';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, signAccessToken, type TestUser } from './helpers/fixtures';

jest.setTimeout(30000);

interface UserProfileResponse {
  id: string;
  nome: string;
  email: string;
  tipo: UserTypePayload;
  matricula: string | null;
  possuiFoto: boolean;
}

const asProfile = (body: unknown): UserProfileResponse => body as UserProfileResponse;

describe('User profile and photos (e2e)', () => {
  let app: INestApplication;

  let dataSource: DataSource;
  let student: TestUser;
  let tutor: TestUser;

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
    tutor = await insertUser(app, dataSource, 'carlos@uefs.br', UserType.TUTOR);
  });

  describe('GET /usuarios/meu-perfil', () => {
    it('returns student profile without photo initially', async () => {
      const response = await api(app, student).get('/usuarios/meu-perfil').expect(200);

      expect(response.body).toEqual({
        id: student.id,
        nome: 'Usuário de Teste',
        email: '20240001@discente.uefs.br',
        tipo: UserTypePayload.ALUNO,
        matricula: '20240001',
        possuiFoto: false,
      });
    });

    it('returns tutor profile with matricula null', async () => {
      const response = await api(app, tutor).get('/usuarios/meu-perfil').expect(200);

      expect(response.body).toEqual({
        id: tutor.id,
        nome: 'Usuário de Teste',
        email: 'carlos@uefs.br',
        tipo: UserTypePayload.PROFESSOR,
        matricula: null,
        possuiFoto: false,
      });
    });

    it('requires authentication', async () => {
      await api(app).get('/usuarios/meu-perfil').expect(401);
    });
  });

  describe('PATCH /usuarios/meu-perfil', () => {
    it('allows student to update only name and preserves other attributes', async () => {
      const response = await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Ana Maria Souza' })
        .expect(200);

      expect(response.body).toEqual({
        id: student.id,
        nome: 'Ana Maria Souza',
        email: '20240001@discente.uefs.br',
        tipo: UserTypePayload.ALUNO,
        matricula: '20240001',
        possuiFoto: false,
      });

      const profileCheck = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      expect(asProfile(profileCheck.body).nome).toBe('Ana Maria Souza');
    });

    it('allows tutor to update only name', async () => {
      const response = await api(app, tutor)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Prof. Carlos Mendes' })
        .expect(200);

      expect(asProfile(response.body).nome).toBe('Prof. Carlos Mendes');
    });

    it('rejects empty body, missing name, or short name with 400', async () => {
      await api(app, student).patch('/usuarios/meu-perfil').send({}).expect(400);
      await api(app, student).patch('/usuarios/meu-perfil').send({ nome: '' }).expect(400);
      await api(app, student).patch('/usuarios/meu-perfil').send({ nome: 'ab' }).expect(400);
      await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'a'.repeat(121) })
        .expect(400);
    });

    it('rejects forbidden extra fields (email, matricula, tipo, ativo)', async () => {
      await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Nome Válido', email: 'outro@discente.uefs.br' })
        .expect(400);

      await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Nome Válido', matricula: '99999999' })
        .expect(400);

      await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Nome Válido', tipo: 'PROFESSOR' })
        .expect(400);

      const unchanged = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      expect(asProfile(unchanged.body).email).toBe('20240001@discente.uefs.br');
      expect(asProfile(unchanged.body).matricula).toBe('20240001');
    });

    it('requires authentication', async () => {
      await api(app).patch('/usuarios/meu-perfil').send({ nome: 'Novo Nome' }).expect(401);
    });
  });

  describe('PUT & DELETE /usuarios/minha-foto and GET /usuarios/:id/foto', () => {
    const uploadPhoto = (user: TestUser, buffer: Buffer, filename: string, mime: string) =>
      request(app.getHttpServer() as Server)
        .put('/api/usuarios/minha-foto')
        .set('Authorization', `Bearer ${user.token}`)
        .attach('foto', buffer, { filename, contentType: mime });

    it('allows adding, updating and removing photo for student and tutor', async () => {
      // 1. Student adds PNG photo
      await uploadPhoto(student, pngPhotoBytes(), 'photo.png', 'image/png').expect(204);

      // Student profile reflects possuiFoto = true
      let profile = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      expect(asProfile(profile.body).possuiFoto).toBe(true);

      // Student photo is served
      let photoResponse = await api(app, student).get(`/usuarios/${student.id}/foto`).expect(200);
      expect(photoResponse.headers['content-type']).toBe('image/png');
      expect(Buffer.from(photoResponse.body as Buffer).equals(pngPhotoBytes())).toBe(true);

      // 2. Student substitutes photo with JPEG
      await uploadPhoto(student, jpegPhotoBytes(), 'photo.jpg', 'image/jpeg').expect(204);

      photoResponse = await api(app, student).get(`/usuarios/${student.id}/foto`).expect(200);
      expect(photoResponse.headers['content-type']).toBe('image/jpeg');

      // 3. Tutor can also add webp photo
      await uploadPhoto(tutor, webpPhotoBytes(), 'photo.webp', 'image/webp').expect(204);

      profile = await api(app, tutor).get('/usuarios/meu-perfil').expect(200);
      expect(asProfile(profile.body).possuiFoto).toBe(true);

      // 4. Student removes photo
      await api(app, student).delete('/usuarios/minha-foto').expect(204);

      profile = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      expect(asProfile(profile.body).possuiFoto).toBe(false);

      await api(app, student).get(`/usuarios/${student.id}/foto`).expect(404);
    });

    it('rejects invalid photo format and preserves previous photo', async () => {
      await uploadPhoto(student, pngPhotoBytes(), 'valid.png', 'image/png').expect(204);

      // Attempt invalid file format
      await uploadPhoto(student, Buffer.from('plain text file'), 'test.txt', 'text/plain').expect(
        400,
      );

      // Previous photo preserved
      const photoResponse = await api(app, student).get(`/usuarios/${student.id}/foto`).expect(200);
      expect(Buffer.from(photoResponse.body as Buffer).equals(pngPhotoBytes())).toBe(true);
    });

    it('rejects photo exceeding 2 MB', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 10);
      await uploadPhoto(student, largeBuffer, 'big.png', 'image/png').expect(413);
    });

    it('requires authentication for photo modification', async () => {
      await api(app).put('/usuarios/minha-foto').expect(401);
      await api(app).delete('/usuarios/minha-foto').expect(401);
    });
  });

  describe('Persistence after new access', () => {
    it('persists updated name and photo on subsequent login', async () => {
      // 1. Update name and upload photo
      await api(app, student)
        .patch('/usuarios/meu-perfil')
        .send({ nome: 'Nome Persistido' })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .put('/api/usuarios/minha-foto')
        .set('Authorization', `Bearer ${student.token}`)
        .attach('foto', pngPhotoBytes(), { filename: 'photo.png', contentType: 'image/png' })
        .expect(204);

      // 2. User accesses the system again (simulating a fresh login / new session token)
      const freshToken = signAccessToken(app, student.id, student.email, student.type);
      const newAccessUser: TestUser = { ...student, token: freshToken };

      const profileResponse = await api(app, newAccessUser).get('/usuarios/meu-perfil').expect(200);

      expect(profileResponse.body).toEqual({
        id: student.id,
        nome: 'Nome Persistido',
        email: student.email,
        tipo: UserTypePayload.ALUNO,
        matricula: '20240001',
        possuiFoto: true,
      });

      const photoResponse = await api(app, newAccessUser)
        .get(`/usuarios/${student.id}/foto`)
        .expect(200);
      expect(Buffer.from(photoResponse.body as Buffer).equals(pngPhotoBytes())).toBe(true);
    });
  });
});
