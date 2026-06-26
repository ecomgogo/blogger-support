import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure
    .output(z.object({ status: z.string(), timestamp: z.number() }))
    .query(() => ({
      status: "ok",
      timestamp: Date.now(),
    })),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
