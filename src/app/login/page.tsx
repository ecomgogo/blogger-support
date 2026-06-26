"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/blogger",
        ].join(" "),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, browser redirects to Google — loading stays true
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Blogger Support</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to connect your Blogger blogs.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Redirecting to Google..." : "Sign in with Google"}
        </Button>
      </div>
    </main>
  );
}
