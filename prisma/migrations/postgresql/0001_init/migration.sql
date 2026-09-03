-- PostgreSQL 初始迁移：opencanvas 全量表（与 prisma/schema.postgres.prisma 对应）
-- 生成方式：由 schema.postgres.prisma 逐模型转换（沙箱无法运行 prisma CLI 时的手工等价版）；
-- 后续可用 `prisma migrate diff` 重新生成并在此基础上演进。

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT '',
    "providerUserId" TEXT NOT NULL DEFAULT '',
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_provider_providerUserId_idx" ON "users"("provider", "providerUserId");

CREATE TABLE "sessions" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "expiresAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token")
);
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '新任务',
    "mode" TEXT NOT NULL DEFAULT 'chat',
    "model" TEXT NOT NULL DEFAULT 'demo',
    "modelProvider" TEXT,
    "deck" TEXT,
    "deckStatus" TEXT,
    "images" TEXT,
    "report" TEXT,
    "doc" TEXT,
    "personaId" TEXT,
    "personaSystem" TEXT,
    "codePreview" TEXT,
    "kbId" TEXT,
    "userId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "conversations_updatedAt_idx" ON "conversations"("updatedAt");

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "error" BOOLEAN NOT NULL DEFAULT false,
    "refs" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "size" INTEGER NOT NULL DEFAULT 0,
    "ext" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "documents_updatedAt_idx" ON "documents"("updatedAt");
CREATE INDEX "documents_name_idx" ON "documents"("name");
CREATE INDEX "documents_userId_updatedAt_idx" ON "documents"("userId", "updatedAt");

CREATE TABLE "knowledge_bases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "semantic" BOOLEAN NOT NULL DEFAULT true,
    "qa" BOOLEAN NOT NULL DEFAULT true,
    "cite" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "knowledge_bases_userId_updatedAt_idx" ON "knowledge_bases"("userId", "updatedAt");

CREATE TABLE "kb_documents" (
    "kbId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "kb_documents_pkey" PRIMARY KEY ("kbId", "documentId")
);
CREATE INDEX "kb_documents_kbId_idx" ON "kb_documents"("kbId");

CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'productivity',
    "mode" TEXT NOT NULL DEFAULT 'chat',
    "prompt" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT '我',
    "uses" INTEGER NOT NULL DEFAULT 0,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "shareCode" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "prompt_templates_updatedAt_idx" ON "prompt_templates"("updatedAt");
CREATE INDEX "prompt_templates_shareCode_idx" ON "prompt_templates"("shareCode");

CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '自定义',
    "emoji" TEXT NOT NULL DEFAULT '🤖',
    "system" TEXT NOT NULL DEFAULT '',
    "starter" TEXT NOT NULL DEFAULT '',
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "shareCode" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "agents_updatedAt_idx" ON "agents"("updatedAt");
CREATE INDEX "agents_shareCode_idx" ON "agents"("shareCode");

CREATE TABLE "case_shares" (
    "code" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "case_shares_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "artifact_shares" (
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "artifact_shares_pkey" PRIMARY KEY ("code")
);
CREATE INDEX "artifact_shares_createdAt_idx" ON "artifact_shares"("createdAt");

CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "renewAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

CREATE TABLE "client_errors" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "stack" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "userId" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "client_errors_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "client_errors_createdAt_idx" ON "client_errors"("createdAt");

CREATE TABLE "gateway_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "modelId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fallback" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'success',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "gateway_usage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "gateway_usage_createdAt_idx" ON "gateway_usage"("createdAt");
CREATE INDEX "gateway_usage_userId_createdAt_idx" ON "gateway_usage"("userId", "createdAt");
CREATE INDEX "gateway_usage_modelId_createdAt_idx" ON "gateway_usage"("modelId", "createdAt");

CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "ref" TEXT,
    "userId" TEXT,
    "createdAt" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "credit_ledger_createdAt_idx" ON "credit_ledger"("createdAt");
CREATE INDEX "credit_ledger_userId_createdAt_idx" ON "credit_ledger"("userId", "createdAt");
