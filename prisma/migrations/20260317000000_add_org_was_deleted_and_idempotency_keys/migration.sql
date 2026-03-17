-- AlterTable: add organization_was_deleted to teams
-- (was applied via db push, never migrated — IF NOT EXISTS makes this idempotent)
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "organization_was_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: idempotency_keys
-- (was applied via db push, never migrated — IF NOT EXISTS makes this idempotent)
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "operation_id" TEXT,
    "response_status" INTEGER NOT NULL,
    "response_body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_token_key" ON "idempotency_keys"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idempotency_keys_user_id_idx" ON "idempotency_keys"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- AddForeignKey (guarded — safe to re-run if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_user_id_fkey'
  ) THEN
    ALTER TABLE "idempotency_keys"
      ADD CONSTRAINT "idempotency_keys_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
