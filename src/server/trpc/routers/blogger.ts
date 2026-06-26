import { z } from "zod";
import { router, authenticatedProcedure } from "../init";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/blogger/auth";
import { listBlogs } from "@/lib/blogger/service";

export const bloggerRouter = router({
  /**
   * List the user's Blogger blogs via the Blogger API.
   */
  listBlogs: authenticatedProcedure.query(async ({ ctx }) => {
    const token = await getValidAccessToken(ctx.tenantId);
    if (!token) {
      return { blogs: [], error: "No valid Blogger token. Please reconnect your Google account." };
    }

    try {
      const blogs = await listBlogs(token);
      return { blogs, error: null };
    } catch (err) {
      return {
        blogs: [],
        error: err instanceof Error ? err.message : "Failed to fetch blogs",
      };
    }
  }),

  /**
   * Connect a Blogger blog to this tenant.
   */
  connectBlog: authenticatedProcedure
    .input(
      z.object({
        bloggerId: z.string(),
        name: z.string(),
        url: z.string(),
        postCount: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already connected
      const existing = await prisma.blog.findFirst({
        where: { tenantId: ctx.tenantId, bloggerId: input.bloggerId },
      });

      if (existing) {
        return { blog: existing, created: false };
      }

      const blog = await prisma.blog.create({
        data: {
          tenantId: ctx.tenantId,
          bloggerId: input.bloggerId,
          name: input.name,
          url: input.url,
          postCount: input.postCount,
        },
      });

      return { blog, created: true };
    }),

  /**
   * Get all connected blogs for the current tenant.
   */
  getConnectedBlogs: authenticatedProcedure.query(async ({ ctx }) => {
    const blogs = await prisma.blog.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { connectedAt: "desc" },
    });

    return { blogs };
  }),

  /**
   * Disconnect a blog from this tenant.
   */
  disconnectBlog: authenticatedProcedure
    .input(z.object({ blogId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.blog.deleteMany({
        where: { id: input.blogId, tenantId: ctx.tenantId },
      });

      return { success: true };
    }),
});
