import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { Discipline } from '../../domain/entities/discipline.entity';
import type { DisciplineRepository } from '../../domain/repositories/discipline.repository';

interface DisciplineRow {
  id: string;
  code: string;
  name: string;
}

const toEntity = (row: DisciplineRow): Discipline => Object.assign(new Discipline(), row);

@Injectable()
export class PgDisciplineRepository implements DisciplineRepository {
  constructor(
    @InjectRepository(Discipline)
    private readonly disciplines: Repository<Discipline>,
  ) {}

  async findAll(): Promise<Discipline[]> {
    const rows = await this.disciplines.query<DisciplineRow[]>(
      'SELECT id, code, name FROM disciplines ORDER BY code;',
    );
    return rows.map(toEntity);
  }

  async create(discipline: Discipline): Promise<Discipline | null> {
    const rows = await this.disciplines.query<DisciplineRow[]>(
      `INSERT INTO disciplines (code, name)
        VALUES ($1, $2)
        ON CONFLICT (code) DO NOTHING
        RETURNING id, code, name;`,
      [discipline.code, discipline.name],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }
}
