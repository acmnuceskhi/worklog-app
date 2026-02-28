-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email_type" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "resend_message_id" TEXT,
    "idempotency_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "request_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bounce_type" TEXT,
    "suppressed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_resend_message_id_key" ON "email_logs"("resend_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_idempotency_key_key" ON "email_logs"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_request_id_key" ON "email_logs"("request_id");

-- CreateIndex
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_email_type_idx" ON "email_logs"("email_type");

-- CreateIndex
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");

-- CreateIndex
CREATE INDEX "email_logs_resend_message_id_idx" ON "email_logs"("resend_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_email_key" ON "email_suppressions"("email");

-- CreateIndex
CREATE INDEX "email_suppressions_email_idx" ON "email_suppressions"("email");

-- CreateIndex
CREATE INDEX "email_suppressions_reason_idx" ON "email_suppressions"("reason");
