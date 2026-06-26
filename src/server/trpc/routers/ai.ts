import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { aiService } from "@/lib/ai/service";
import { checkCredits, deductCredit, getCreditInfo } from "@/lib/ai/credits";
import { prisma } from "@/lib/prisma";

export const aiRouter = router({
  /**
   * Get current credit status.
   */
  getCredits: authenticatedProcedure.query(async ({ ctx }) => {
    return getCreditInfo(ctx.tenantId);
  }),

  /**
   * Polish: fix grammar and improve fluency.
   */
  polish: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);

      // Move to Processing
      await prisma.article.updateMany({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
        },
        data: { status: "Processing" },
      });

      let polished: string;
      let creditsDeducted = false;

      try {
        polished = await aiService.polish(input.content);
        await deductCredit(ctx.tenantId, "polish", input.articleId);
        creditsDeducted = true;
      } catch (err) {
        // AI failed — revert to Draft
        await prisma.article.updateMany({
          where: { id: input.articleId },
          data: { status: "Draft" },
        });
        throw err;
      }

      return { polished };
    }),

  /**
   * Accept the polished result. Saves content and deducts credit
   * (already deducted during polish call, just transition to Review).
   */
  acceptPolish: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.article.updateMany({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
          status: "Processing",
        },
        data: {
          content: input.content,
          status: "Review",
        },
      });

      return { success: true };
    }),

  /**
   * Reject the polished result. Reverts to Draft, refunds if needed.
   */
  rejectPolish: authenticatedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.article.updateMany({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
          status: "Processing",
        },
        data: { status: "Draft" },
      });

      return { success: true };
    }),
});
