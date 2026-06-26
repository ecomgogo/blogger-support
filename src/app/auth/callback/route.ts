import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll(cookiesToSet) {
            // Cookies are set via the response below
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Create a response that sets the Supabase cookies and redirects
      const response = NextResponse.redirect(`${origin}${next}`);

      // Re-create the client to capture cookies to set on the response
      const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll(cookiesToSet) {
              for (const { name, value, options } of cookiesToSet) {
                response.cookies.set(name, value, options);
              }
            },
          },
        }
      );

      // Exchange again to get the cookies on the response object
      await authClient.auth.exchangeCodeForSession(code);

      return response;
    }
  }

  // Something went wrong — redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
