import { createServerClient } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * Server-side Supabase client for use in tRPC procedures and server components.
 * Reads cookies from the request to authenticate the user session.
 */
export function createSupabaseServerClient(cookieHeader?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Parse cookies from the Cookie header
  const cookies = parseCookies(cookieHeader ?? "");

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        // Server-side mutations can't easily set cookies on the response here
        // Cookie setting is handled in the auth callback and proxy middleware
      },
    },
  });
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name && rest.length > 0) {
      result[name.trim()] = rest.join("=").trim();
    }
  });

  return result;
}
