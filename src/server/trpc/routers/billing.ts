import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";

export const billingRouter = router({
  /**
   * Get current subscription info.
   */
  getSubscription: authenticatedProcedure.query(async ({ ctx }) => {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: ctx.tenantId },
    });

    return {
      plan: sub?.plan ?? "Free",
      status: sub?.status ?? "Active",
      currentPeriodEnd: sub?.currentPeriodEnd ?? new Date(),
    };
  }),

  /**
   * Get credit usage history.
   */
  getUsageHistory: authenticatedProcedure.query(async ({ ctx }) => {
    const transactions = await prisma.creditTransaction.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return { transactions };
  }),

  /**
   * Upgrade to a new plan (MVP: immediate switch).
   */
  upgradePlan: authenticatedProcedure
    .input(z.object({ plan: z.enum(["Free", "Pro", "Unlimited"]) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: ctx.tenantId },
          data: { plan: input.plan },
        }),
        prisma.subscription.upsert({
          where: { tenantId: ctx.tenantId },
          create: {
            tenantId: ctx.tenantId,
            plan: input.plan,
            currentPeriodEnd: periodEnd,
          },
          update: {
            plan: input.plan,
            currentPeriodEnd: periodEnd,
          },
        }),
        // Update credit limit
        prisma.credit.upsert({
          where: { tenantId: ctx.tenantId },
          create: {
            tenantId: ctx.tenantId,
            amount: input.plan === "Free" ? 10 : input.plan === "Pro" ? 50 : 999,
            monthlyLimit: input.plan === "Free" ? 10 : input.plan === "Pro" ? 50 : 999,
            periodEnd,
          },
          update: {
            amount: input.plan === "Free" ? 10 : input.plan === "Pro" ? 50 : 999,
            monthlyLimit: input.plan === "Free" ? 10 : input.plan === "Pro" ? 50 : 999,
            periodStart: now,
            periodEnd,
          },
        }),
      ]);

      return { success: true, plan: input.plan };
    }),
});
