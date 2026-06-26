import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/blogger/auth";
import {
  createPost,
  updatePost,
  deletePost,
  listPosts,
  getPost,
} from "@/lib/blogger/service";

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

  /**
   * Publish an article to Blogger. Creates or updates the post,
   * stores the bloggerPostId, syncs labels, and sets status to Published.
   */
  publishArticle: authenticatedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.article.findFirst({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
          status: { in: ["Draft", "Review"] },
        },
        include: {
          blog: true,
          labels: { include: { label: true } },
        },
      });

      if (!article) throw new Error("Article not found or not publishable");

      const token = await getValidAccessToken(ctx.tenantId);
      if (!token) throw new Error("No valid Blogger token");

      const labelNames = article.labels.map((al) => al.label.name);
      const postData = {
        title: article.title,
        content: article.content,
        labels: labelNames.length > 0 ? labelNames : undefined,
      };

      let bloggerPostId: string;
      let bloggerUrl: string;

      if (article.bloggerPostId) {
        // Update existing post
        const post = await updatePost(token, article.blog.bloggerId, article.bloggerPostId, postData);
        bloggerPostId = post.id;
        bloggerUrl = post.url ?? "";
      } else {
        // Create new post
        const post = await createPost(token, article.blog.bloggerId, postData);
        bloggerPostId = post.id;
        bloggerUrl = post.url ?? "";
      }

      const updated = await prisma.article.update({
        where: { id: article.id },
        data: {
          bloggerPostId,
          status: "Published",
          publishedAt: new Date(),
        },
        include: { labels: { include: { label: true } } },
      });

      // Update blog post count
      await prisma.blog.update({
        where: { id: article.blogId },
        data: { postCount: { increment: article.bloggerPostId ? 0 : 1 } },
      });

      return { article: updated, bloggerUrl };
    }),

  /**
   * Unpublish an article — delete from Blogger, revert to Draft.
   */
  unpublishArticle: authenticatedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const article = await prisma.article.findFirst({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
          status: "Published",
        },
        include: { blog: true },
      });

      if (!article || !article.bloggerPostId) {
        throw new Error("Article not found or not published");
      }

      const token = await getValidAccessToken(ctx.tenantId);
      if (!token) throw new Error("No valid Blogger token");

      await deletePost(token, article.blog.bloggerId, article.bloggerPostId);

      const updated = await prisma.article.update({
        where: { id: article.id },
        data: {
          bloggerPostId: null,
          status: "Draft",
          publishedAt: null,
        },
        include: { labels: { include: { label: true } } },
      });

      return { article: updated };
    }),

  /**
   * Pull posts from Blogger that are not yet mirrored locally.
   */
  pullPosts: authenticatedProcedure
    .input(z.object({ blogId: z.string() }))
    .query(async ({ ctx, input }) => {
      const blog = await prisma.blog.findFirst({
        where: { id: input.blogId, tenantId: ctx.tenantId },
      });
      if (!blog) throw new Error("Blog not found");

      const token = await getValidAccessToken(ctx.tenantId);
      if (!token) throw new Error("No valid Blogger token");

      const { posts } = await listPosts(token, blog.bloggerId);

      // Get already-mirrored post IDs
      const mirrored = await prisma.article.findMany({
        where: {
          blogId: blog.id,
          bloggerPostId: { not: null },
        },
        select: { bloggerPostId: true },
      });
      const mirroredIds = new Set(
        mirrored.map((m) => m.bloggerPostId).filter(Boolean) as string[]
      );

      const unmirrored = posts.filter((p) => !mirroredIds.has(p.id));

      return { posts: unmirrored };
    }),

  /**
   * Import a Blogger post as a local mirror.
   */
  importPost: authenticatedProcedure
    .input(z.object({ blogId: z.string(), bloggerPostId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const blog = await prisma.blog.findFirst({
        where: { id: input.blogId, tenantId: ctx.tenantId },
      });
      if (!blog) throw new Error("Blog not found");

      const token = await getValidAccessToken(ctx.tenantId);
      if (!token) throw new Error("No valid Blogger token");

      const post = await getPost(token, blog.bloggerId, input.bloggerPostId);

      const article = await prisma.article.create({
        data: {
          blogId: blog.id,
          bloggerPostId: post.id,
          title: post.title ?? "Untitled",
          content: post.content ?? "",
          status: "Published",
          publishedAt: post.published ? new Date(post.published) : new Date(),
        },
        include: { labels: { include: { label: true } } },
      });

      // Import labels
      if (post.labels) {
        for (const name of post.labels) {
          let label = await prisma.label.findFirst({
            where: { tenantId: ctx.tenantId, name },
          });
          if (!label) {
            label = await prisma.label.create({
              data: { tenantId: ctx.tenantId, name },
            });
          }
          await prisma.articleLabel.create({
            data: { articleId: article.id, labelId: label.id },
          });
        }
      }

      return { article };
    }),

  /**
   * Transition an article to a new status. Validates the transition
   * against the allowed state machine transitions.
   */
  transitionStatus: authenticatedProcedure
    .input(
      z.object({
        articleId: z.string(),
        to: z.enum(["Draft", "Processing", "Review", "Published", "Archived"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const VALID_TRANSITIONS: Record<string, string[]> = {
        Draft: ["Processing", "Review"],
        Processing: ["Review"],
        Review: ["Published", "Draft"],
        Published: ["Archived"],
        Archived: ["Draft"],
      };

      const article = await prisma.article.findFirst({
        where: {
          id: input.articleId,
          blog: { tenantId: ctx.tenantId },
        },
        include: { blog: true },
      });

      if (!article) throw new Error("Article not found");

      const allowed = VALID_TRANSITIONS[article.status];
      if (!allowed || !allowed.includes(input.to)) {
        throw new Error(
          `Invalid transition: ${article.status} → ${input.to}`
        );
      }

      // Handle Blogger side effects
      if (input.to === "Archived" && article.bloggerPostId) {
        const token = await getValidAccessToken(ctx.tenantId);
        if (token) {
          await deletePost(token, article.blog.bloggerId, article.bloggerPostId);
        }
      }

      const updated = await prisma.article.update({
        where: { id: article.id },
        data: {
          status: input.to,
          ...(input.to === "Published"
            ? { publishedAt: new Date() }
            : {}),
          ...(input.to === "Archived"
            ? { bloggerPostId: null, publishedAt: null }
            : {}),
        },
        include: { labels: { include: { label: true } } },
      });

      return { article: updated };
    }),
});
