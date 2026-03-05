-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "organization_invitations" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "organization_invitations_expires_at_idx" ON "organization_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "team_members_expires_at_idx" ON "team_members"("expires_at");
