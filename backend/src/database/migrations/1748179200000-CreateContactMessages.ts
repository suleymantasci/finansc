import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactMessages1748179200000 implements MigrationInterface {
  name = 'CreateContactMessages1748179200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "email" varchar(200) NOT NULL,
        "subject" varchar(300) NOT NULL,
        "message" text NOT NULL,
        "ipAddress" varchar(64),
        "userAgent" varchar(512),
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_messages" PRIMARY KEY ("id")
      )
    `);

    // Eğer pgcrypto extension yoksa uuid_generate_v4() çalışmaz.
    // Alternatif: gen_random_uuid() (Postgres 13+ built-in)
    // Önce extension kontrolü yap, yoksa oluştur.
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto"
    `);

    // Email kolonuna index (admin listeleme için)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contact_messages_email"
        ON "contact_messages" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_messages_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages"`);
  }
}
