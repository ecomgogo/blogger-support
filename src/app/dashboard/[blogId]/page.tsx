"use client";

import { ArticleList } from "@/components/articles/article-list";
import { trpc } from "@/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BlogArticlesPage() {
  const params = useParams<{ blogId: string }>();
  const router = useRouter();
  const { data: blogData, isLoading } = trpc.blogger.getConnectedBlogs.useQuery();
  const blog = blogData?.blogs.find((b) => b.id === params.blogId);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Blog not found.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-8">
      <div className="mb-6 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Dashboard
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{blog.name}</h1>
        <p className="text-sm text-muted-foreground">{blog.url}</p>
      </div>
      <ArticleList blogId={params.blogId} />
    </main>
  );
}
