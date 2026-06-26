import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refresh session (important: keeps the session alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes: no redirect
  const publicPaths = ["/login", "/auth"];
  const isPublicPath = publicPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  // tRPC routes: allow through (auth check happens in tRPC middleware)
  const isTrpcPath = request.nextUrl.pathname.startsWith("/api/trpc");

  if (!user && !isPublicPath && !isTrpcPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
