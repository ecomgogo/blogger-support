import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";
import { bloggerRouter } from "./blogger";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure
    .output(z.object({ status: z.string(), timestamp: z.number() }))
    .query(() => ({
      status: "ok",
      timestamp: Date.now(),
    })),
  auth: authRouter,
  blogger: bloggerRouter,
});

export type AppRouter = typeof appRouter;
