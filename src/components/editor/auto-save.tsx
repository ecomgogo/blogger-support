"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";

type SaveStatus = "saved" | "saving" | "unsaved";

interface AutoSaveProps {
  onSave: () => Promise<void>;
  /** Debounce delay in ms (default 2000) */
  delay?: number;
}

export function useAutoSave({ onSave, delay = 2000 }: AutoSaveProps) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveFnRef = useRef(onSave);
  saveFnRef.current = onSave;

  const triggerSave = useCallback(() => {
    setStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveFnRef.current();
        setStatus("saved");
      } catch {
        setStatus("unsaved");
      }
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, triggerSave };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case "saving":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </span>
      );
    case "saved":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Saved
        </span>
      );
    case "unsaved":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
          Unsaved changes
        </span>
      );
  }
}
