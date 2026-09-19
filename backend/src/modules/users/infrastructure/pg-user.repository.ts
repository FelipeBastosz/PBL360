import { Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { User } from '../domain/entities/user.entity';
import { UserType } from '../domain/enums/user-type.enum';
import { IUserRepository } from '../domain/repositories/user.repository.interface';

interface UserDbRow {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  matricula: string | null;
  foto_url: string | null;
  tipo: string;
  ativo: boolean;
  criado_em: Date;
}

@Injectable()
export class PgUserRepository implements IUserRepository {
  constructor(private readonly dataSource: DataSource) {}

  private mapToDomain(row: UserDbRow): User {
    return new User({
      id: row.id,
      nome: row.nome,
      email: row.email,
      senhaHash: row.senha_hash,
      matricula: row.matricula,
      fotoUrl: row.foto_url,
      tipo: row.tipo === 'TUTOR' ? UserType.TUTOR : UserType.ALUNO,
      ativo: row.ativo,
      criadoEm: row.criado_em,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
        SELECT id, nome, email, senha_hash, matricula, foto_url, tipo, ativo, criado_em
        FROM usuario
        WHERE email = $1
        LIMIT 1;
        `;

    const rows: UserDbRow[] = await this.dataSource.query(query, [email]);
    if (!rows || rows.length == 0) {
      return null;
    }

    return this.mapToDomain(rows[0]);
  }

  async findByID(id: string): Promise<User | null> {
    const query = `
        SELECT id, nome, email, senha_hash, matricula, foto_url, tipo, ativo, criado_em
        FROM usuario
        WHERE id = $1
        LIMIT 1;
        `;

    const rows: UserDbRow[] = await this.dataSource.query(query, [id]);
    if (!rows || rows.length == 0) {
      return null;
    }
    return this.mapToDomain(rows[0]);
  }

  async save(user: User): Promise<User> {
    const query = `
        INSERT INTO usuario (nome, email, senha_hash, matricula, foto_url, tipo, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nome, email, senha_hash, matricula, foto_url, tipo, ativo, criado_em;
        `;

    const rows: UserDbRow[] = await this.dataSource.query(query, [
      user.nome,
      user.email,
      user.senhaHash,
      user.matricula,
      user.fotoUrl,
      user.tipo,
      user.ativo,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error('Failed to persist user in database.');
    }

    return this.mapToDomain(rows[0]);
  }
}
