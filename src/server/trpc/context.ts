import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    // Pass the request to read session cookies
    const supabase = createSupabaseServerClient(opts?.req as Request | undefined);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      userId = session.user.id;

      let tenant = await prisma.tenant.findUnique({
        where: { supabaseUserId: userId },
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: { supabaseUserId: userId },
        });
      }

      // Store Google provider token from session
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
    // No valid session
  }

  return {
    tenantId,
    userId,
    headers: opts?.req?.headers ?? new Headers(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
