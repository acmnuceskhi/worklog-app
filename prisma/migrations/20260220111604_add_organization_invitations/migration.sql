-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "token" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");

-- CreateIndex
CREATE INDEX "organization_invitations_user_id_idx" ON "organization_invitations"("user_id");

-- CreateIndex
CREATE INDEX "organization_invitations_status_idx" ON "organization_invitations"("status");

-- CreateIndex
CREATE INDEX "organization_invitations_user_id_status_idx" ON "organization_invitations"("user_id", "status");

-- CreateIndex
CREATE INDEX "organization_invitations_organization_id_status_idx" ON "organization_invitations"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_organization_id_user_id_key" ON "organization_invitations"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_organization_id_email_key" ON "organization_invitations"("organization_id", "email");

-- CreateIndex
CREATE INDEX "team_members_team_id_status_idx" ON "team_members"("team_id", "status");

-- CreateIndex
CREATE INDEX "worklogs_team_id_createdAt_idx" ON "worklogs"("team_id", "createdAt");

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
