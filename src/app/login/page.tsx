const SUPABASE_URL = "https://tuymzcezoiqknkunmsrc.supabase.co";
const SCOPES = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/blogger";
const REDIRECT = "http://localhost:3000/auth/callback";

const OAUTH_URL = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(REDIRECT)}&scopes=${encodeURIComponent(SCOPES)}`;

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Blogger Support</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to connect your Blogger blogs.
          </p>
        </div>

        <a
          href={OAUTH_URL}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80"
        >
          Sign in with Google
        </a>
      </div>
    </main>
  );
}
