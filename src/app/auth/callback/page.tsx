"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowserClient();

      // Hash fragment contains tokens from Supabase Auth (PKCE flow)
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const providerToken = params.get("provider_token");
        const providerRefreshToken = params.get("refresh_token"); // same as Supabase refresh token

        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            return;
          }

          // Now store provider tokens via tRPC or redirect
          // The tRPC context will create the tenant on next request
          router.push("/onboarding");
          router.refresh();
          return;
        }
      }

      // Fallback: try to get existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/onboarding");
        router.refresh();
        return;
      }

      setError("Authentication failed. Please try again.");
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-sm underline">
            Back to login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
    </main>
  );
}
