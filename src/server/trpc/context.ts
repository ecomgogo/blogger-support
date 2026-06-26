import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

/**
 * tRPC context. Currently placeholder — auth middleware (Issue #3)
 * will populate tenant and user from the Supabase session.
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  return {
    headers: opts?.req?.headers ?? new Headers(),
    tenantId: null as string | null,
    userId: null as string | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
