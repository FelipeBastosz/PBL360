import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateFeedbacks1790993231253 implements MigrationInterface {
  name = 'CreateFeedbacks1790993231253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback_revisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "feedback_id" uuid NOT NULL, "conteudo_anterior_nota" numeric(5,2), "conteudo_anterior_texto" text NOT NULL, "edited_by" uuid NOT NULL, "edited_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_75910a3c1fd8146aa4f869ab0db" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feedback_escopo_enum" AS ENUM('ALUNO', 'SESSAO', 'PROBLEMA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "autor_id" uuid NOT NULL, "problema_id" uuid NOT NULL, "destinatario_id" uuid, "sessao_id" uuid, "escopo" "public"."feedback_escopo_enum" NOT NULL, "nota" numeric(5,2), "texto" text NOT NULL, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "editado_em" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP TYPE "public"."feedback_escopo_enum"`);
    await queryRunner.query(`DROP TABLE "feedback_revisions"`);
  }
}
