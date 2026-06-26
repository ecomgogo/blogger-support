"use client";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { useAutoSave, SaveIndicator } from "@/components/editor/auto-save";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/articles/status-badge";
import { DiffView } from "@/components/editor/diff-view";
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
  const polishMutation = trpc.ai.polish.useMutation();
  const acceptPolish = trpc.ai.acceptPolish.useMutation({
    onSuccess: () => {
      utils.article.getArticle.invalidate({ id: params.articleId });
      setPolishedText(null);
    },
  });
  const rejectPolish = trpc.ai.rejectPolish.useMutation({
    onSuccess: () => {
      utils.article.getArticle.invalidate({ id: params.articleId });
      setPolishedText(null);
    },
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState<{ keyword: string; score: number }[] | null>(null);
  const initializedRef = useRef(false);

  // Additional AI mutations
  const rewriteMutation = trpc.ai.rewrite.useMutation();
  const expandMutation = trpc.ai.expand.useMutation();
  const condenseMutation = trpc.ai.condense.useMutation();
  const keywordsMutation = trpc.ai.suggestKeywords.useMutation();
  const seoMutation = trpc.ai.generateSEO.useMutation();

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
                onClick={async () => {
                  // Transition to Processing and call AI
                  await transitionStatus.mutateAsync({ articleId: article.id, to: "Processing" });
                  try {
                    const result = await polishMutation.mutateAsync({
                      articleId: article.id,
                      content: content || article.content,
                    });
                    setPolishedText(result.polished);
                  } catch {
                    // AI failed — transitionStatus already rolled back in handler
                  }
                }}
                disabled={transitionStatus.isPending || polishMutation.isPending}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {polishMutation.isPending ? "Polishing..." : "Polish with AI"}
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

      {/* AI Toolbox */}
      {article.status === "Draft" && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-xs font-medium text-muted-foreground mr-2">AI Tools:</span>
          {/* Tone selector + Rewrite */}
          <select
            className="h-8 rounded border bg-background px-2 text-xs"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            {["professional", "casual", "formal", "humorous"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const sel = window.getSelection()?.toString();
              const text = sel || content || article.content;
              try {
                const r = await rewriteMutation.mutateAsync({ articleId: article.id, content: text, tone });
                setPolishedText(r.result);
              } catch {}
            }}
            disabled={rewriteMutation.isPending}
          >
            Rewrite
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const sel = window.getSelection()?.toString();
              const text = sel || content || article.content;
              try {
                const r = await expandMutation.mutateAsync({ articleId: article.id, content: text });
                setPolishedText(r.result);
              } catch {}
            }}
            disabled={expandMutation.isPending}
          >
            Expand
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const sel = window.getSelection()?.toString();
              const text = sel || content || article.content;
              try {
                const r = await condenseMutation.mutateAsync({ articleId: article.id, content: text });
                setPolishedText(r.result);
              } catch {}
            }}
            disabled={condenseMutation.isPending}
          >
            Condense
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const r = await keywordsMutation.mutateAsync({
                  articleId: article.id,
                  content: content || article.content,
                });
                try {
                  setKeywords(JSON.parse(r.keywords));
                } catch {
                  setKeywords([{ keyword: r.keywords, score: 0 }]);
                }
              } catch {}
            }}
            disabled={keywordsMutation.isPending}
          >
            Keywords
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              seoMutation.mutate({
                articleId: article.id,
                content: content || article.content,
              })
            }
            disabled={seoMutation.isPending}
          >
            SEO Meta
          </Button>
        </div>
      )}

      {/* Keywords panel */}
      {keywords && keywords.length > 0 && (
        <div className="mb-4 rounded-lg border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Keyword Suggestions</span>
            <button onClick={() => setKeywords(null)} className="text-xs text-muted-foreground">×</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs dark:bg-blue-950/30">
                {k.keyword}
                <span className="text-muted-foreground">{k.score}/10</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEO fields */}
      {article.seoTitle && (
        <div className="mb-4 space-y-2 rounded-lg border p-3">
          <span className="text-xs font-medium">SEO Metadata</span>
          <input
            className="w-full border-0 bg-transparent text-sm outline-none"
            value={article.seoTitle}
            onChange={(e) => {
              const val = e.target.value;
              trpc.article.updateArticle.useMutation().mutate({
                id: article.id,
                ...{ seoTitle: val },
              } as any);
            }}
            placeholder="SEO Title (max 60 chars)"
          />
          <textarea
            className="w-full border-0 bg-transparent text-xs outline-none resize-none"
            rows={2}
            value={article.seoDescription ?? ""}
            placeholder="Meta Description (max 160 chars)"
          />
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <MarkdownEditor
          value={content}
          onChange={handleContentChange}
          onImagePaste={handleImagePaste}
        />
      </div>

      {/* AI Diff View */}
      {polishedText && article.status === "Processing" && (
        <div className="mt-6">
          <DiffView
            original={content || article.content}
            suggested={polishedText}
            loading={acceptPolish.isPending || rejectPolish.isPending}
            onAccept={async () => {
              const newContent = polishedText;
              await acceptPolish.mutateAsync({
                articleId: article.id,
                content: newContent,
              });
              setContent(newContent);
            }}
            onReject={() => rejectPolish.mutate({ articleId: article.id })}
          />
        </div>
      )}
    </main>
  );
}
