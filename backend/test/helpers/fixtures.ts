import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server } from 'node:http';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { ACCESS_TOKEN_AUDIENCE } from '@/shared/security/access-token';
import { UserType } from '@/users/domain/enums/user-type.enum';

export interface TestUser {
  id: string;
  email: string;
  type: UserType;
  token: string;
}

export const cleanDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(
    'TRUNCATE problem_grades, session_grades, criterion_grades, formula_components, formulas, grade_adjustments, evaluation_items, evaluations, session_evaluation_configs, observation_tags, observations, behavior_tags, feedback_revisions, feedback, session_attachments, attendances, session_roles, sessions, problems, performance_criteria, performance_tables, room_students, room_tutor_events, room_tutors, rooms, password_reset_codes, email_verification_codes, user_photos, users CASCADE;',
  );
};

export const signAccessToken = (
  app: INestApplication,
  id: string,
  email: string,
  type: UserType,
  version = 0,
): string =>
  app
    .get(JwtService)
    .sign({ sub: id, email, type, ver: version }, { audience: ACCESS_TOKEN_AUDIENCE });

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
  const token = signAccessToken(app, row.id, email, type);

  return { id: row.id, email, type, token };
};

export const api = (app: INestApplication, user?: TestUser) => {
  const server = request(app.getHttpServer() as Server);
  const auth = (req: request.Test): request.Test =>
    user ? req.set('Authorization', `Bearer ${user.token}`) : req;

  return {
    get: (path: string) => auth(server.get(`/api${path}`)),
    post: (path: string, body: object = {}) => auth(server.post(`/api${path}`)).send(body),
    put: (path: string, body: object = {}) => auth(server.put(`/api${path}`)).send(body),
    patch: (path: string, body: object = {}) => auth(server.patch(`/api${path}`)).send(body),
    delete: (path: string) => auth(server.delete(`/api${path}`)),
  };
};
