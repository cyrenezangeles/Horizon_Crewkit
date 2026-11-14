import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireHr } from "@/backend/auth";
import { contentToHtml } from "@/backend/content";
import { getArticleById, getCategories } from "@/backend/data/kb";
import { ArticleEditor } from "@/frontend/components/article-editor";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Edit article",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  await requireHr();
  const [article, categories] = await Promise.all([
    getArticleById(id),
    getCategories(),
  ]);

  if (!article) {
    notFound();
  }

  const tags = (article.article_tags ?? [])
    .map((link) => link.tags?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");

  return (
    <ArticleEditor
      categories={categories}
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: contentToHtml(article.content),
        categoryId: article.category_id,
        status: article.status,
        tags,
      }}
    />
  );
}
