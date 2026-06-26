import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";

export const articleRouter = router({
  /**
   * List articles for a blog, ordered by most recently updated.
   */
  listArticles: authenticatedProcedure
    .input(z.object({ blogId: z.string() }))
    .query(async ({ ctx, input }) => {
      const articles = await prisma.article.findMany({
        where: {
          blogId: input.blogId,
          blog: { tenantId: ctx.tenantId },
        },
        include: {
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return { articles };
    }),

  /**
   * Get a single article by ID.
   */
  getArticle: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const article = await prisma.article.findFirst({
        where: {
          id: input.id,
          blog: { tenantId: ctx.tenantId },
        },
        include: {
          labels: { include: { label: true } },
        },
      });

      return { article };
    }),

  /**
   * Create a new draft article.
   */
  createArticle: authenticatedProcedure
    .input(z.object({ blogId: z.string(), title: z.string().default("Untitled") }))
    .mutation(async ({ ctx, input }) => {
      // Verify blog belongs to tenant
      const blog = await prisma.blog.findFirst({
        where: { id: input.blogId, tenantId: ctx.tenantId },
      });
      if (!blog) throw new Error("Blog not found");

      const article = await prisma.article.create({
        data: {
          blogId: input.blogId,
          title: input.title,
          content: "",
          status: "Draft",
        },
        include: {
          labels: { include: { label: true } },
        },
      });

      return { article };
    }),

  /**
   * Update an article (auto-save). Only Draft and Review status articles can be edited.
   */
  updateArticle: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.article.findFirst({
        where: {
          id: input.id,
          blog: { tenantId: ctx.tenantId },
          status: { in: ["Draft", "Review"] },
        },
      });

      if (!article) throw new Error("Article not found or not editable");

      const updated = await prisma.article.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
        },
        include: {
          labels: { include: { label: true } },
        },
      });

      return { article: updated };
    }),

  /**
   * Delete a draft article.
   */
  deleteArticle: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.article.deleteMany({
        where: {
          id: input.id,
          blog: { tenantId: ctx.tenantId },
          status: "Draft",
        },
      });

      return { success: true };
    }),

  /**
   * Add a label to an article. Creates the label if it doesn't exist.
   */
  addLabel: authenticatedProcedure
    .input(z.object({ articleId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find or create label
      let label = await prisma.label.findFirst({
        where: { tenantId: ctx.tenantId, name: input.name },
      });

      if (!label) {
        label = await prisma.label.create({
          data: { tenantId: ctx.tenantId, name: input.name },
        });
      }

      // Create join (ignore if already exists)
      await prisma.articleLabel.upsert({
        where: {
          articleId_labelId: {
            articleId: input.articleId,
            labelId: label.id,
          },
        },
        create: { articleId: input.articleId, labelId: label.id },
        update: {},
      });

      return { label };
    }),

  /**
   * Remove a label from an article.
   */
  removeLabel: authenticatedProcedure
    .input(z.object({ articleId: z.string(), labelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.articleLabel.deleteMany({
        where: {
          articleId: input.articleId,
          labelId: input.labelId,
        },
      });

      return { success: true };
    }),
});
