-- Blogger Support: Initial schema migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tuymzcezoiqknkunmsrc/sql/new

-- Enums
CREATE TYPE "MemberRole" AS ENUM ('Author', 'Editor', 'Reviewer');
CREATE TYPE "ArticleStatus" AS ENUM ('Draft', 'Processing', 'Review', 'Published', 'Archived');
CREATE TYPE "InvitationStatus" AS ENUM ('Pending', 'Accepted', 'Expired');
CREATE TYPE "SubscriptionPlan" AS ENUM ('Free', 'Pro', 'Unlimited');
CREATE TYPE "SubscriptionStatus" AS ENUM ('Active', 'PastDue', 'Canceled', 'Incomplete');

-- Tenant
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiry" INTEGER,
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_supabaseUserId_key" ON "Tenant"("supabaseUserId");

-- Blog
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bloggerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Blog_tenantId_idx" ON "Blog"("tenantId");

-- Member
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'Author',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Member_tenantId_userId_key" ON "Member"("tenantId", "userId");
CREATE INDEX "Member_tenantId_idx" ON "Member"("tenantId");

-- Article
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "bloggerPostId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'Draft',
    "assigneeId" TEXT,
    "sourceArticleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Article_blogId_idx" ON "Article"("blogId");
CREATE INDEX "Article_status_idx" ON "Article"("status");
CREATE INDEX "Article_assigneeId_idx" ON "Article"("assigneeId");

-- Label
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seoDescription" TEXT,
    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Label_tenantId_name_key" ON "Label"("tenantId", "name");
CREATE INDEX "Label_tenantId_idx" ON "Label"("tenantId");

-- ArticleLabel (join)
CREATE TABLE "ArticleLabel" (
    "articleId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "ArticleLabel_pkey" PRIMARY KEY ("articleId", "labelId")
);

-- Credit
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 10,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 10,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Credit_tenantId_key" ON "Credit"("tenantId");

-- CreditTransaction
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT,
    "capability" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CreditTransaction_creditId_idx" ON "CreditTransaction"("creditId");
CREATE INDEX "CreditTransaction_tenantId_timestamp_idx" ON "CreditTransaction"("tenantId", "timestamp");

-- Invitation
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'Author',
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX "Invitation_tenantId_idx" ON "Invitation"("tenantId");
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'Free',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'Active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- Foreign Keys
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceArticleId_fkey" FOREIGN KEY ("sourceArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Label" ADD CONSTRAINT "Label_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleLabel" ADD CONSTRAINT "ArticleLabel_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleLabel" ADD CONSTRAINT "ArticleLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
