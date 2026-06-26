"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trpc } from "@/trpc/react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { data: tenant, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const { data: blogData } = trpc.blogger.getConnectedBlogs.useQuery(undefined, {
    enabled: !!tenant,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const blogs = blogData?.blogs ?? [];

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-lg font-semibold tracking-tight hover:opacity-80"
          >
            Blogger Support
          </button>
          {blogs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm">
                  Blogs ({blogs.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {blogs.map((blog) => (
                  <DropdownMenuItem
                    key={blog.id}
                    onClick={() => router.push(`/dashboard/${blog.id}`)}
                  >
                    <div className="truncate">
                      <span className="font-medium">{blog.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {blog.postCount} posts
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ) : tenant ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="text-sm font-medium capitalize">
                  {tenant.plan}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <span className="text-xs text-muted-foreground">
                  Plan: {tenant.plan}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
