import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";
import { bloggerRouter } from "./blogger";
import { articleRouter } from "./article";
import { aiRouter } from "./ai";
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
  article: articleRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
