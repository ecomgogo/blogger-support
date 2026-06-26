"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface DiffViewProps {
  original: string;
  suggested: string;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function DiffView({
  original,
  suggested,
  onAccept,
  onReject,
  loading,
}: DiffViewProps) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">AI Suggestions</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={loading}
          >
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
          <Button size="sm" onClick={onAccept} disabled={loading}>
            <Check className="mr-1 h-4 w-4" />
            Accept
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Original
          </span>
          <div className="rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {original}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-green-600 uppercase">
            Suggested
          </span>
          <div className="rounded border border-green-200 bg-green-50/50 p-3 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto dark:bg-green-950/20 dark:border-green-800">
            {suggested}
          </div>
        </div>
      </div>
    </div>
  );
}
