"use client";

import { trpc } from "@/trpc/react";

export default function DashboardPage() {
  const { data: tenant, isLoading, error } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">Failed to load account info.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to Blogger Support
      </p>
      {tenant && (
        <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
          <p>
            Plan: <span className="font-medium capitalize">{tenant.plan}</span>
          </p>
          <p>
            Joined:{" "}
            <span>
              {new Date(tenant.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      )}
    </main>
  );
}
