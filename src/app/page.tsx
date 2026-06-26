"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const me = trpc.auth.me.useQuery();
  const { data: blogData, isLoading: blogsLoading } = trpc.blogger.getConnectedBlogs.useQuery();

  if (me.isLoading || blogsLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (me.error) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">Failed to load account info.</p>
      </main>
    );
  }

  const blogs = blogData?.blogs ?? [];

  return (
    <main className="flex flex-1 flex-col p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {me.data && (
          <p className="mt-1 text-sm text-muted-foreground">
            Plan: <span className="font-medium capitalize">{me.data.plan}</span> · Joined{" "}
            {new Date(me.data.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Blogs</h2>
          <Button size="sm" variant="outline" onClick={() => router.push("/onboarding")}>
            <Plus className="mr-1 h-4 w-4" />
            Add Blog
          </Button>
        </div>

        {blogs.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-sm text-muted-foreground">No blogs connected yet.</p>
            <Button className="mt-4" onClick={() => router.push("/onboarding")}>
              Connect Your First Blog
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="cursor-pointer rounded-lg border p-4 space-y-1 hover:border-primary/50 transition-colors"
                onClick={() => router.push(`/dashboard/${blog.id}`)}
              >
                <h3 className="font-medium truncate">{blog.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{blog.url}</p>
                <p className="text-xs text-muted-foreground">
                  {blog.postCount} posts
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
