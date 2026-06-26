import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Middleware that enforces authentication. Use this for any procedure
 * that requires a valid session and tenant.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.tenantId as string,
      userId: ctx.userId as string,
    },
  });
});

/**
 * Procedure that requires authentication. The context will have
 * non-nullable tenantId and userId.
 */
export const authenticatedProcedure = t.procedure.use(enforceAuth);
