import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTokenVersion1791930000000 implements MigrationInterface {
  name = 'AddUserTokenVersion1791930000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0');
    // Browser storage and JWT validation change together: require a fresh login.
    await queryRunner.query('UPDATE "refresh_tokens" SET "isRevoked" = true WHERE "isRevoked" = false');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "tokenVersion"');
  }
}
