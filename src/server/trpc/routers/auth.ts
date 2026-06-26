import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";

export const authRouter = router({
  /**
   * Get the current authenticated tenant's info.
   */
  me: authenticatedProcedure.query(async ({ ctx }) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        supabaseUserId: true,
        plan: true,
        createdAt: true,
      },
    });

    return tenant;
  }),

  /**
   * Get or create the tenant for the current user.
   * Called on first app load after auth.
   */
  getOrCreateTenant: authenticatedProcedure
    .output(
      z.object({
        id: z.string(),
        plan: z.string(),
        createdAt: z.date(),
      })
    )
    .query(async ({ ctx }) => {
      let tenant = await prisma.tenant.findUnique({
        where: { supabaseUserId: ctx.userId },
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { supabaseUserId: ctx.userId },
        });
      }

      return {
        id: tenant.id,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
      };
    }),
});
