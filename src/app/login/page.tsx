"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function handleSignIn() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
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
        <Button
          className="w-full"
          size="lg"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Sign in with Google"}
        </Button>
      </div>
    </main>
  );
}
