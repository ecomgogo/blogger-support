"use client";

import MDEditor from "@uiw/react-md-editor";
import { useState } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImagePaste?: (file: File) => Promise<string | null>;
}

export function MarkdownEditor({ value, onChange, onImagePaste }: MarkdownEditorProps) {
  const [uploading, setUploading] = useState(false);

  async function handlePaste(e: React.ClipboardEvent) {
    if (!onImagePaste) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploading(true);
        try {
          const url = await onImagePaste(file);
          if (url) {
            const mdImage = `![${file.name}](${url})`;
            onChange(value ? `${value}\n\n${mdImage}` : mdImage);
          }
        } finally {
          setUploading(false);
        }
        break;
      }
    }
  }

  return (
    <div className="relative" data-color-mode="light" onPaste={handlePaste}>
      {uploading && (
        <div className="absolute top-2 right-2 z-50 rounded bg-muted px-2 py-1 text-xs">
          Uploading image...
        </div>
      )}
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? "")}
        height={500}
        preview="live"
      />
    </div>
  );
}
