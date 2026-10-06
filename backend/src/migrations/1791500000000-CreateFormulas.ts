import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormulas1791500000000 implements MigrationInterface {
  name = 'CreateFormulas1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "formulas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "problem_id" uuid NOT NULL,
        "scope" varchar(30) NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "active" boolean NOT NULL DEFAULT true,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_formulas" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "formula_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "formula_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "reference_id" uuid,
        "weight" numeric(5,2) NOT NULL,
        CONSTRAINT "pk_formula_components" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_formulas_problem_scope" ON "formulas" ("problem_id", "scope")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_formulas_created_by" ON "formulas" ("created_by")`);

    await queryRunner.query(
      `ALTER TABLE "formulas" ADD CONSTRAINT "fk_formulas_problem" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formulas" ADD CONSTRAINT "fk_formulas_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "formula_components" ADD CONSTRAINT "fk_formula_components_formula" FOREIGN KEY ("formula_id") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formula_components" DROP CONSTRAINT "fk_formula_components_formula"`,
    );
    await queryRunner.query(`ALTER TABLE "formulas" DROP CONSTRAINT "fk_formulas_created_by"`);
    await queryRunner.query(`ALTER TABLE "formulas" DROP CONSTRAINT "fk_formulas_problem"`);
    await queryRunner.query(`DROP INDEX "public"."idx_formulas_created_by"`);
    await queryRunner.query(`DROP INDEX "public"."idx_formulas_problem_scope"`);
    await queryRunner.query(`DROP TABLE "formula_components"`);
    await queryRunner.query(`DROP TABLE "formulas"`);
  }
}
