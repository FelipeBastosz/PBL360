import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server } from 'node:http';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';

export interface TestUser {
  id: string;
  email: string;
  type: UserType;
  token: string;
}

export const cleanDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(
    'TRUNCATE problems, room_tutors, rooms, password_reset_codes, email_verification_codes, users CASCADE;',
  );
};

export const insertUser = async (
  app: INestApplication,
  dataSource: DataSource,
  email: string,
  type: UserType = UserType.TUTOR,
): Promise<TestUser> => {
  const [row] = await dataSource.query<[{ id: string }]>(
    `INSERT INTO users (name, email, password_hash, type, registration_number, active)
      VALUES ('Usuário de Teste', $1, 'hash', $2, $3, true)
      RETURNING id;`,
    [email, type, type === UserType.STUDENT ? email.slice(0, 8) : null],
  );
  const token = app.get(JwtService).sign({ sub: row.id, email, type });

  return { id: row.id, email, type, token };
};

export const api = (app: INestApplication, user?: TestUser) => {
  const server = request(app.getHttpServer() as Server);
  const auth = (req: request.Test): request.Test =>
    user ? req.set('Authorization', `Bearer ${user.token}`) : req;

  return {
    get: (path: string) => auth(server.get(`/api${path}`)),
    post: (path: string, body: object = {}) => auth(server.post(`/api${path}`)).send(body),
    patch: (path: string, body: object = {}) => auth(server.patch(`/api${path}`)).send(body),
    delete: (path: string) => auth(server.delete(`/api${path}`)),
  };
};
