import { prisma } from "@/lib/prisma";

const CREDIT_COSTS: Record<string, number> = {
  polish: 1,
  rewrite: 1,
  expand: 1,
  condense: 1,
  suggestKeywords: 2,
  generateSEO: 2,
  fullSEO: 5,
  translate: 3,
  generateAltText: 1,
};

/**
 * Get current credit info for a tenant. Creates a Credit record
 * if one doesn't exist (defaults to Free plan with 10 credits/month).
 */
export async function getCreditInfo(tenantId: string) {
  let credit = await prisma.credit.findUnique({
    where: { tenantId },
  });

  if (!credit) {
    // Initialize with free tier defaults
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    credit = await prisma.credit.create({
      data: {
        tenantId,
        amount: 10,
        monthlyLimit: 10,
        periodStart: now,
        periodEnd,
      },
    });
  }

  // Reset if period has ended
  const now = new Date();
  if (credit.periodEnd <= now) {
    const periodStart = new Date();
    const periodEnd = new Date(
      periodStart.getFullYear(),
      periodStart.getMonth() + 1,
      1
    );
    credit = await prisma.credit.update({
      where: { tenantId },
      data: {
        amount: credit.monthlyLimit,
        periodStart,
        periodEnd,
      },
    });
  }

  return { remaining: credit.amount, monthlyLimit: credit.monthlyLimit };
}

/**
 * Check if tenant has enough credits. Throws if not.
 */
export async function checkCredits(tenantId: string): Promise<number> {
  const { remaining } = await getCreditInfo(tenantId);
  if (remaining <= 0) {
    throw new Error("No credits remaining. Upgrade your plan to continue.");
  }
  return remaining;
}

/**
 * Deduct credits for an AI capability. Logs the transaction.
 */
export async function deductCredit(
  tenantId: string,
  capability: string,
  articleId?: string
): Promise<number> {
  const cost = CREDIT_COSTS[capability] ?? 1;

  // Deduct atomically
  const credit = await prisma.credit.update({
    where: { tenantId },
    data: {
      amount: { decrement: cost },
    },
  });

  // Log transaction
  await prisma.creditTransaction.create({
    data: {
      creditId: credit.id,
      tenantId,
      articleId,
      capability,
      creditsUsed: cost,
    },
  });

  return credit.amount;
}
