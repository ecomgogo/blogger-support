import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

/**
 * tRPC context. Extracts the authenticated user from Supabase and
 * resolves the corresponding Tenant record (creating one on first sign-in).
 * Also stores Google provider tokens from the Supabase session.
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    // Pass cookies from the request so Supabase can read the session
    const cookieHeader = opts?.req?.headers?.get?.("cookie") ?? null;
    const supabase = createSupabaseServerClient(cookieHeader);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      userId = session.user.id;

      // Find or create Tenant
      let tenant = await prisma.tenant.findUnique({
        where: { supabaseUserId: userId },
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { supabaseUserId: userId },
        });
      }

      // Store Google provider token from session if available
      if (session.provider_token) {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            googleAccessToken: encrypt(session.provider_token),
            ...(session.provider_refresh_token
              ? { googleRefreshToken: encrypt(session.provider_refresh_token) }
              : {}),
            googleTokenExpiry: expiresAt,
          },
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
