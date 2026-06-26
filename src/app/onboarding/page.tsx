"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);
  const { data, isLoading, error } = trpc.blogger.listBlogs.useQuery();
  const connectBlog = trpc.blogger.connectBlog.useMutation({
    onSuccess: () => router.push("/"),
  });

  async function handleConnect(bloggerId: string, name: string, url: string, postCount: number) {
    setConnecting(bloggerId);
    await connectBlog.mutateAsync({ bloggerId, name, url, postCount });
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Connect Your Blog</h1>
          <p className="text-sm text-muted-foreground">
            Select a Blogger blog to get started. You can add more later.
          </p>
        </div>

        {error || data?.error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-sm text-destructive">
              {data?.error ?? "Failed to load your blogs. Please try signing in again."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/login")}
            >
              Sign in again
            </Button>
          </div>
        ) : data?.blogs.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No Blogger blogs found on your Google account.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Create a blog at{" "}
              <a
                href="https://www.blogger.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                blogger.com
              </a>{" "}
              first, then come back.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.blogs.map((blog) => (
              <div
                key={blog.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{blog.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{blog.url}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {blog.posts?.totalItems ?? 0} posts
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    handleConnect(blog.id, blog.name, blog.url, blog.posts?.totalItems ?? 0)
                  }
                  disabled={connecting === blog.id}
                >
                  {connecting === blog.id ? "Connecting..." : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
