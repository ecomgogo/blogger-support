"use client";

import { TRPCProvider } from "@/trpc/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
