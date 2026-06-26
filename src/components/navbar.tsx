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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            Blogger Support
          </span>
        </div>

        {isLoading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ) : tenant ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {tenant.id.slice(0, 8)}...
                </span>
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
