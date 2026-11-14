import type { Metadata } from "next";
import { requireHr } from "@/backend/auth";
import { getCategories } from "@/backend/data/kb";
import { ArticleEditor } from "@/frontend/components/article-editor";

export const metadata: Metadata = {
  title: "New article",
};

export default async function NewArticlePage() {
  await requireHr();
  const categories = await getCategories();

  return <ArticleEditor categories={categories} />;
}
