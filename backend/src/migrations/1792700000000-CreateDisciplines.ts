import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisciplines1792700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE disciplines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(6) NOT NULL,
        name VARCHAR(120) NOT NULL,
        CONSTRAINT uq_disciplines_code UNIQUE (code)
      );
      INSERT INTO disciplines (code, name)
      VALUES ('EXA854', 'MI Algoritmos'),
             ('EXA613', 'MI Engenharia de Software'),
             ('EXA863', 'MI Programação'),
             ('TEC498', 'MI Projeto de Circuitos Digitais'),
             ('TEC499', 'MI Sistemas Digitais'),
             ('TEC502', 'MI Concorrência e Conectividade'),
             ('TEC506', 'MI Projetos de Circuitos Eletrônicos'),
             ('TEC513', 'MI Processamento Digital de Sinais');
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS disciplines;');
  }
}
