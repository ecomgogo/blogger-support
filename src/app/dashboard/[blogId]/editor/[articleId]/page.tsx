"use client";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { useAutoSave, SaveIndicator } from "@/components/editor/auto-save";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/articles/status-badge";
import { trpc } from "@/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X, Send, ExternalLink, Archive, RotateCcw, Sparkles, Check, XCircle } from "lucide-react";
import { useState, useCallback, useRef } from "react";

export default function EditorPage() {
  const params = useParams<{ blogId: string; articleId: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const isNew = params.articleId === "new";

  const { data: articleData, isLoading } = trpc.article.getArticle.useQuery(
    { id: params.articleId },
    { enabled: !isNew }
  );

  const updateArticle = trpc.article.updateArticle.useMutation();
  const addLabel = trpc.article.addLabel.useMutation({
    onSuccess: () =>
      utils.article.getArticle.invalidate({ id: params.articleId }),
  });
  const removeLabel = trpc.article.removeLabel.useMutation({
    onSuccess: () =>
      utils.article.getArticle.invalidate({ id: params.articleId }),
  });
  const publishArticle = trpc.article.publishArticle.useMutation({
    onSuccess: (data) => {
      utils.article.getArticle.invalidate({ id: params.articleId });
      setPublishedUrl(data.bloggerUrl);
    },
  });
  const transitionStatus = trpc.article.transitionStatus.useMutation({
    onSuccess: () => {
      utils.article.getArticle.invalidate({ id: params.articleId });
    },
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const initializedRef = useRef(false);

  // Initialize from loaded data
  if (!initializedRef.current && articleData?.article && !isLoading) {
    setTitle(articleData.article.title);
    setContent(articleData.article.content);
    initializedRef.current = true;
  }

  const save = useCallback(async () => {
    if (isNew || !articleData?.article) return;
    await updateArticle.mutateAsync({
      id: articleData.article.id,
      title: title || "Untitled",
      content,
    });
  }, [isNew, articleData?.article, title, content, updateArticle]);

  const { status, triggerSave } = useAutoSave({ onSave: save });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerSave();
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerSave();
  };

  async function handleAddLabel() {
    const name = labelInput.trim();
    if (!name || !articleData?.article) return;
    await addLabel.mutateAsync({ articleId: articleData.article.id, name });
    setLabelInput("");
  }

  async function handleImagePaste(file: File): Promise<string | null> {
    // For MVP, convert to base64 data URI and embed directly
    // Blogger API image upload requires access token from server
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  if (isNew) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Create an article from the article list first.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!articleData?.article) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Article not found.</p>
      </main>
    );
  }

  const article = articleData.article;
  const labels = article.labels.map((al) => al.label);

  return (
    <main className="flex flex-1 flex-col p-8">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/${params.blogId}`)}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <SaveIndicator status={status} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={article.status} />
          {/* Draft → Processing */}
          {article.status === "Draft" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => transitionStatus.mutate({ articleId: article.id, to: "Processing" })}
                disabled={transitionStatus.isPending}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                Submit for AI
              </Button>
              <Button
                size="sm"
                onClick={() => publishArticle.mutate({ articleId: article.id })}
                disabled={publishArticle.isPending}
              >
                <Send className="mr-1 h-4 w-4" />
                Publish
              </Button>
            </>
          )}
          {/* Processing → Review (placeholder for AI completion) */}
          {article.status === "Processing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => transitionStatus.mutate({ articleId: article.id, to: "Review" })}
              disabled={transitionStatus.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Mark AI Complete
            </Button>
          )}
          {/* Review → Published / Draft */}
          {article.status === "Review" && (
            <>
              <Button
                size="sm"
                onClick={() => publishArticle.mutate({ articleId: article.id })}
                disabled={publishArticle.isPending}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve & Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => transitionStatus.mutate({ articleId: article.id, to: "Draft" })}
                disabled={transitionStatus.isPending}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {/* Published → Archived */}
          {article.status === "Published" && (
            <>
              {publishedUrl && (
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 inline-flex items-center gap-1 hover:underline"
                >
                  Live <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => transitionStatus.mutate({ articleId: article.id, to: "Archived" })}
                disabled={transitionStatus.isPending}
              >
                <Archive className="mr-1 h-4 w-4" />
                Archive
              </Button>
            </>
          )}
          {/* Archived → Draft */}
          {article.status === "Archived" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => transitionStatus.mutate({ articleId: article.id, to: "Draft" })}
              disabled={transitionStatus.isPending}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Restore to Draft
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <input
        className="mb-4 w-full border-0 bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50"
        placeholder="Article title"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
      />

      {/* Labels */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
          >
            {label.name}
            <button
              onClick={() =>
                removeLabel.mutate({ articleId: article.id, labelId: label.id })
              }
              className="ml-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            className="h-7 w-28 rounded-full border bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground/50"
            placeholder="Add label..."
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddLabel();
            }}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <MarkdownEditor
          value={content}
          onChange={handleContentChange}
          onImagePaste={handleImagePaste}
        />
      </div>
    </main>
  );
}
