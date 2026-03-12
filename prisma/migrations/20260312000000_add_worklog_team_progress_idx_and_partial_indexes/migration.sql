-- CreateIndex: composite index for pending review count queries (WHERE teamId=X AND progressStatus='COMPLETED')
CREATE INDEX "worklogs_team_id_progress_status_idx" ON "worklogs"("team_id", "progressStatus");

-- CreateIndex: partial index on team_members status (PostgreSQL native, not Prisma DSL)
-- Speeds up invitation cleanup: WHERE status IN ('PENDING', 'ACCEPTED')
CREATE INDEX "team_members_status_active_partial_idx"
  ON "team_members"("status")
  WHERE status IN ('PENDING', 'ACCEPTED');

-- CreateIndex: partial index on organization_invitations status (PostgreSQL native, not Prisma DSL)
-- Speeds up invitation cleanup: WHERE status IN ('PENDING', 'ACCEPTED')
CREATE INDEX "org_invitations_status_active_partial_idx"
  ON "organization_invitations"("status")
  WHERE status IN ('PENDING', 'ACCEPTED');

-- CreateIndex: partial composite index on organization_invitations (org_id + status)
-- Speeds up: WHERE organizationId=X AND status IN ('PENDING', 'ACCEPTED')
CREATE INDEX "org_invitations_org_id_status_active_partial_idx"
  ON "organization_invitations"("organization_id", "status")
  WHERE status IN ('PENDING', 'ACCEPTED');
