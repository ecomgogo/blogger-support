import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client. When called without request context,
 * uses empty cookies. Pass a request to read the session from cookies.
 */
export function createSupabaseServerClient(request?: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  // Parse cookies from the request's Cookie header
  const cookieEntries: { name: string; value: string }[] = [];

  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      cookieHeader.split(";").forEach((c) => {
        const idx = c.indexOf("=");
        if (idx > 0) {
          cookieEntries.push({
            name: c.substring(0, idx).trim(),
            value: c.substring(idx + 1).trim(),
          });
        }
      });
    }
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieEntries;
      },
      setAll() {
        // No-op: cookie setting happens in the auth callback
      },
    },
  });
}
