-- CreateTable
CREATE TABLE "worklog_attachments" (
    "id" TEXT NOT NULL,
    "worklog_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worklog_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "worklog_attachments" ADD CONSTRAINT "worklog_attachments_worklog_id_fkey" FOREIGN KEY ("worklog_id") REFERENCES "worklogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
