import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Favoriler tablosu. Entity uzun süredir vardı ama hiçbir modüle bağlı değildi;
 * tablo DB'de hiç oluşturulmamıştı (/api/favorites 404).
 */
export class CreateFavorites1790000000000 implements MigrationInterface {
  name = 'CreateFavorites1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "favorites_favoritetype_enum" AS ENUM ('gold', 'stock', 'index', 'currency', 'commodity', 'tool');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "favoriteType" "favorites_favoritetype_enum" NOT NULL,
        "symbolCode" varchar(50) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_favorites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_favorites_user_type_symbol" UNIQUE ("userId", "favoriteType", "symbolCode"),
        CONSTRAINT "FK_favorites_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_favorites_userId" ON "favorites" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "favorites_favoritetype_enum"`);
  }
}
