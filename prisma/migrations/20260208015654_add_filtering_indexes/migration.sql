-- CreateIndex
CREATE INDEX "teams_organization_id_idx" ON "teams"("organization_id");

-- CreateIndex
CREATE INDEX "worklogs_team_id_idx" ON "worklogs"("team_id");

-- CreateIndex
CREATE INDEX "worklogs_user_id_idx" ON "worklogs"("user_id");

-- CreateIndex
CREATE INDEX "worklogs_progressStatus_idx" ON "worklogs"("progressStatus");

-- CreateIndex
CREATE INDEX "worklogs_createdAt_idx" ON "worklogs"("createdAt");

-- CreateIndex
CREATE INDEX "worklogs_deadline_idx" ON "worklogs"("deadline");
