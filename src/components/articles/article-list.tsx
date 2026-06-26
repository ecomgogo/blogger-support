"use client";

import { trpc } from "@/trpc/react";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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

  const articles = data?.articles ?? [];

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

      {articles.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">No articles yet.</p>
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
          {articles.map((article) => (
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
