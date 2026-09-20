import { type MigrationInterface, type QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEmailVerificationCodes1726798800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verification_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '160',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '6',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'email_verification_codes',
      new TableIndex({
        name: 'IDX_email_verification_codes_email',
        columnNames: ['email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('email_verification_codes', 'IDX_email_verification_codes_email');
    await queryRunner.dropTable('email_verification_codes');
  }
}
