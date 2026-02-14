-- DropIndex
DROP INDEX "worklogs_progressStatus_idx";

-- CreateIndex
CREATE INDEX "worklogs_user_id_progressStatus_idx" ON "worklogs"("user_id", "progressStatus");
