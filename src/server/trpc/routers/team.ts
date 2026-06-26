import { z } from "zod";
import { randomBytes } from "node:crypto";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";

export const teamRouter = router({
  /**
   * Invite a new member to the tenant.
   */
  invite: authenticatedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["Author", "Editor", "Reviewer"]) }))
    .mutation(async ({ ctx, input }) => {
      // Check existing member
      const existing = await prisma.member.findFirst({
        where: { tenantId: ctx.tenantId, userId: ctx.userId },
      });

      const token = randomBytes(32).toString("hex");

      const invitation = await prisma.invitation.create({
        data: {
          tenantId: ctx.tenantId,
          email: input.email,
          role: input.role,
          token,
        },
      });

      return { invitation };
    }),

  /**
   * List all members of the tenant.
   */
  listMembers: authenticatedProcedure.query(async ({ ctx }) => {
    const members = await prisma.member.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { joinedAt: "desc" },
    });
    return { members };
  }),

  /**
   * List pending invitations.
   */
  getInvitations: authenticatedProcedure.query(async ({ ctx }) => {
    const invitations = await prisma.invitation.findMany({
      where: { tenantId: ctx.tenantId, status: "Pending" },
      orderBy: { createdAt: "desc" },
    });
    return { invitations };
  }),

  /**
   * Update a member's role.
   */
  updateRole: authenticatedProcedure
    .input(z.object({ memberId: z.string(), role: z.enum(["Author", "Editor", "Reviewer"]) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.member.updateMany({
        where: { id: input.memberId, tenantId: ctx.tenantId },
        data: { role: input.role },
      });
      return { success: true };
    }),

  /**
   * Remove a member from the tenant.
   */
  removeMember: authenticatedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.member.deleteMany({
        where: { id: input.memberId, tenantId: ctx.tenantId },
      });
      return { success: true };
    }),

  /**
   * Assign an article to a member.
   */
  assignArticle: authenticatedProcedure
    .input(z.object({ articleId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.article.updateMany({
        where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
        data: { assigneeId: input.memberId },
      });
      return { success: true };
    }),

  /**
   * Get articles in Review status (editor queue).
   */
  getReviewQueue: authenticatedProcedure.query(async ({ ctx }) => {
    const articles = await prisma.article.findMany({
      where: {
        blog: { tenantId: ctx.tenantId },
        status: "Review",
      },
      include: {
        blog: { select: { name: true } },
        labels: { include: { label: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { articles };
  }),
});
