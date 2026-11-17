import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import type { FeedbackTemplateRepository } from '../../domain/repositories/feedback-template.repository';

interface FeedbackTemplateRow {
  id: string;
  title: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const FEEDBACK_TEMPLATE_COLUMNS = `id, title, text, created_at AS "createdAt", updated_at AS "updatedAt"`;

const toEntity = (row: FeedbackTemplateRow): FeedbackTemplate =>
  Object.assign(new FeedbackTemplate(), row);

@Injectable()
export class PgFeedbackTemplateRepository implements FeedbackTemplateRepository {
  constructor(
    @InjectRepository(FeedbackTemplate)
    private readonly templates: Repository<FeedbackTemplate>,
  ) {}

  async findAll(): Promise<FeedbackTemplate[]> {
    const rows = await this.templates.query<FeedbackTemplateRow[]>(
      `SELECT ${FEEDBACK_TEMPLATE_COLUMNS} FROM feedback_templates ORDER BY id ASC;`,
    );
    return rows.map(toEntity);
  }
}
