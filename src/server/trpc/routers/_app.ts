import { router, publicProcedure } from "../init";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure
    .output(z.object({ status: z.string(), timestamp: z.number() }))
    .query(() => ({
      status: "ok",
      timestamp: Date.now(),
    })),
});

export type AppRouter = typeof appRouter;
