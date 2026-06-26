import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

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
            // Will be set on the response
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}${next}`);

      // Set cookies on the response
      const cookieClient = createServerClient(
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

      await cookieClient.auth.exchangeCodeForSession(code);

      // Store Google tokens in the Tenant record
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;
      const userId = data.session.user.id;

      if (providerToken && providerRefreshToken && userId) {
        try {
          // Find the tenant (created by tRPC context on first load)
          let tenant = await prisma.tenant.findUnique({
            where: { supabaseUserId: userId },
          });

          if (!tenant) {
            tenant = await prisma.tenant.create({
              data: { supabaseUserId: userId },
            });
          }

          // Google access tokens expire in 3600s by default
          const expiresAt = Math.floor(Date.now() / 1000) + 3600;

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              googleAccessToken: encrypt(providerToken),
              googleRefreshToken: encrypt(providerRefreshToken),
              googleTokenExpiry: expiresAt,
            },
          });
        } catch {
          // Token storage failed — non-fatal, user can re-auth
          console.error("Failed to store Google tokens for tenant");
        }
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
