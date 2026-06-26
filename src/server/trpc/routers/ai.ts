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

  /**
   * Rewrite text in a specific tone.
   */
  rewrite: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string(), tone: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);

      await prisma.article.updateMany({
        where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
        data: { status: "Processing" },
      });

      try {
        const result = await aiService.rewrite(input.content, input.tone);
        await deductCredit(ctx.tenantId, "rewrite", input.articleId);
        return { result };
      } catch (err) {
        await prisma.article.updateMany({
          where: { id: input.articleId },
          data: { status: "Draft" },
        });
        throw err;
      }
    }),

  /**
   * Expand a paragraph with more detail.
   */
  expand: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      await prisma.article.updateMany({
        where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
        data: { status: "Processing" },
      });

      try {
        const result = await aiService.expand(input.content);
        await deductCredit(ctx.tenantId, "expand", input.articleId);
        return { result };
      } catch (err) {
        await prisma.article.updateMany({
          where: { id: input.articleId },
          data: { status: "Draft" },
        });
        throw err;
      }
    }),

  /**
   * Condense a paragraph.
   */
  condense: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      await prisma.article.updateMany({
        where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
        data: { status: "Processing" },
      });

      try {
        const result = await aiService.condense(input.content);
        await deductCredit(ctx.tenantId, "condense", input.articleId);
        return { result };
      } catch (err) {
        await prisma.article.updateMany({
          where: { id: input.articleId },
          data: { status: "Draft" },
        });
        throw err;
      }
    }),

  /**
   * Suggest SEO keywords for the article.
   */
  suggestKeywords: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      const result = await aiService.suggestKeywords(input.content);
      await deductCredit(ctx.tenantId, "suggestKeywords", input.articleId);
      return { keywords: result };
    }),

  /**
   * Generate SEO title and meta description.
   */
  generateSEO: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      const result = await aiService.generateSEO(input.content);
      await deductCredit(ctx.tenantId, "generateSEO", input.articleId);

      // Parse JSON result and save to article
      try {
        const seo = JSON.parse(result) as { title: string; description: string };
        await prisma.article.updateMany({
          where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
          data: { seoTitle: seo.title, seoDescription: seo.description },
        });
        return { seoTitle: seo.title, seoDescription: seo.description };
      } catch {
        // If JSON parse fails, return raw result as description
        await prisma.article.updateMany({
          where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
          data: { seoDescription: result },
        });
        return { seoTitle: null, seoDescription: result };
      }
    }),

  /**
   * Full SEO optimization for a target keyword.
   */
  fullSEO: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string(), keyword: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      await prisma.article.updateMany({
        where: { id: input.articleId, blog: { tenantId: ctx.tenantId } },
        data: { status: "Processing" },
      });

      try {
        const result = await aiService.fullSEO(input.content, input.keyword);
        await deductCredit(ctx.tenantId, "fullSEO", input.articleId);
        return { result };
      } catch (err) {
        await prisma.article.updateMany({
          where: { id: input.articleId },
          data: { status: "Draft" },
        });
        throw err;
      }
    }),

  /**
   * Translate article to another language. Returns translated text
   * that can be saved as a new article.
   */
  translate: authenticatedProcedure
    .input(z.object({ articleId: z.string(), content: z.string(), language: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      const result = await aiService.translate(input.content, input.language);
      await deductCredit(ctx.tenantId, "translate", input.articleId);
      return { result };
    }),

  /**
   * Generate alt text for an image.
   */
  generateAltText: authenticatedProcedure
    .input(z.object({ articleId: z.string(), imageBase64: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await checkCredits(ctx.tenantId);
      const result = await aiService.generateAltText(input.imageBase64);
      await deductCredit(ctx.tenantId, "generateAltText", input.articleId);
      return { altText: result };
    }),
});
