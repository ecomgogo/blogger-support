import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

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

  /**
   * Store Google OAuth provider tokens in the tenant record.
   */
  storeProviderTokens: authenticatedProcedure
    .input(
      z.object({
        providerToken: z.string(),
        providerRefreshToken: z.string().optional(),
        expiresIn: z.number().default(3600),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = Math.floor(Date.now() / 1000) + input.expiresIn;

      await prisma.tenant.update({
        where: { id: ctx.tenantId },
        data: {
          googleAccessToken: encrypt(input.providerToken),
          ...(input.providerRefreshToken
            ? { googleRefreshToken: encrypt(input.providerRefreshToken) }
            : {}),
          googleTokenExpiry: expiresAt,
        },
      });

      return { success: true };
    }),
});
