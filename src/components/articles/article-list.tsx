"use client";

import { trpc } from "@/trpc/react";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Download } from "lucide-react";
import { useState } from "react";

interface ArticleListProps {
  blogId: string;
}

export function ArticleList({ blogId }: ArticleListProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.article.listArticles.useQuery({ blogId });
  const createArticle = trpc.article.createArticle.useMutation({
    onSuccess: (res) => {
      utils.article.listArticles.invalidate({ blogId });
      router.push(`/dashboard/${blogId}/editor/${res.article.id}`);
    },
  });
  const deleteArticle = trpc.article.deleteArticle.useMutation({
    onSuccess: () => utils.article.listArticles.invalidate({ blogId }),
  });
  const pullPosts = trpc.article.pullPosts.useQuery(
    { blogId },
    { enabled: false }
  );
  const importPost = trpc.article.importPost.useMutation({
    onSuccess: () => {
      utils.article.listArticles.invalidate({ blogId });
      utils.article.pullPosts.invalidate({ blogId });
      setShowImport(false);
    },
  });

  const [showImport, setShowImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const articles = data?.articles ?? [];
  const filtered = statusFilter === "All"
    ? articles
    : articles.filter((a) => a.status === statusFilter);

  const STATUSES = ["All", "Draft", "Processing", "Review", "Published", "Archived"];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Articles ({articles.length})
        </h2>
        <Button
          size="sm"
          onClick={() =>
            createArticle.mutate({ blogId, title: "Untitled" })
          }
          disabled={createArticle.isPending}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Article
        </Button>
      </div>

      {/* Import from Blogger */}
      {showImport && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Import from Blogger</h3>
            <Button variant="ghost" size="sm" onClick={() => { setShowImport(false); }}>
              Cancel
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pullPosts.refetch()}
            disabled={pullPosts.isFetching}
          >
            {pullPosts.isFetching ? "Loading..." : "Refresh posts"}
          </Button>
          {pullPosts.data?.posts && pullPosts.data.posts.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pullPosts.data.posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div className="truncate flex-1">
                    <span className="font-medium">{post.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {post.updated ? new Date(post.updated).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => importPost.mutate({ blogId, bloggerPostId: post.id })}
                    disabled={importPost.isPending}
                  >
                    Import
                  </Button>
                </div>
              ))}
            </div>
          )}
          {pullPosts.data?.posts && pullPosts.data.posts.length === 0 && (
            <p className="text-xs text-muted-foreground">All posts are already imported.</p>
          )}
        </div>
      )}

      {!showImport && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowImport(true); pullPosts.refetch(); }}
        >
          <Download className="mr-1 h-4 w-4" />
          Import from Blogger
        </Button>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === s
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-muted hover:border-foreground/30"
            }`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1 opacity-50">
                ({articles.filter((a) => a.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {statusFilter === "All" ? "No articles yet." : `No ${statusFilter} articles.`}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() =>
              createArticle.mutate({ blogId, title: "Untitled" })
            }
          >
            Create your first article
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
              onClick={() =>
                router.push(`/dashboard/${blogId}/editor/${article.id}`)
              }
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{article.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={article.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                  {article.labels.length > 0 && (
                    <div className="flex gap-1">
                      {article.labels.map((al) => (
                        <span
                          key={al.label.id}
                          className="text-xs bg-muted px-1.5 py-0.5 rounded"
                        >
                          {al.label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {article.status === "Draft" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteArticle.mutate({ id: article.id });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
