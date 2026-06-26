import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * tRPC context. Extracts the authenticated user from Supabase and
 * resolves the corresponding Tenant record (creating one on first sign-in).
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;

      // Find or create Tenant
      let tenant = await prisma.tenant.findUnique({
        where: { supabaseUserId: user.id },
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { supabaseUserId: user.id },
        });
      }

      tenantId = tenant.id;
    }
  } catch {
    // No valid session — tenantId and userId remain null
  }

  return {
    tenantId,
    userId,
    headers: opts?.req?.headers ?? new Headers(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
