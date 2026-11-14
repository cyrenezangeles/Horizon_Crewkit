"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { requireHr } from "@/backend/auth";
import { invalidateCategoriesCache } from "@/backend/data/kb";
import { excerpt, slugify, stripHtml } from "@/frontend/lib/utils";
import type { ArticleStatus, Category } from "@/backend/types";

export type ArticleFormState = {
  error?: string;
};

export type CreateCategoryResult =
  | { ok: true; category: Category }
  | { ok: false; error: string };

type DbClient = Awaited<ReturnType<typeof createClient>>;

async function syncTags(
  supabase: DbClient,
  articleId: string,
  input: string,
): Promise<string | null> {
  const names = input
    .split(/[,\n]/)
    .map((value) => value.replace(/^#/, "").trim())
    .filter(Boolean);

  const tags = new Map<string, string>();

  for (const name of names) {
    const slug = slugify(name);
    if (slug && !tags.has(slug)) {
      tags.set(slug, name);
    }
  }

  const { error: clearError } = await supabase
    .from("article_tags")
    .delete()
    .eq("article_id", articleId);

  if (clearError) {
    return "Could not update the article tags.";
  }

  for (const [slug, name] of tags) {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ slug, name }, { onConflict: "slug" })
      .select("id")
      .single();

    if (tagError || !tag) {
      return "Could not save one of the tags.";
    }

    const { error: linkError } = await supabase
      .from("article_tags")
      .insert({ article_id: articleId, tag_id: tag.id });

    if (linkError) {
      return "Could not link one of the tags.";
    }
  }

  return null;
}

export async function createCategory(
  nameInput: string,
): Promise<CreateCategoryResult> {
  await requireHr();

  const name = nameInput.replace(/\s+/g, " ").trim();

  if (name.length < 2) {
    return { ok: false, error: "Use at least 2 characters for the name." };
  }

  if (name.length > 60) {
    return { ok: false, error: "Keep category names under 60 characters." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { ok: false, error: "Use at least one letter or number." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { ok: true, category: existing as Category };
  }

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = Number(last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({ slug, name, sort_order: sortOrder })
    .select("id, slug, name, description, icon, sort_order")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Could not create the category. Please try again.",
    };
  }

  invalidateCategoriesCache();
  revalidatePath("/kb", "layout");
  revalidatePath("/admin/articles");

  return { ok: true, category: data as Category };
}

export async function saveArticle(
  _previousState: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const user = await requireHr();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summaryInput = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const status: ArticleStatus =
    formData.get("status") === "published" ? "published" : "draft";
  const tagsInput = String(formData.get("tags") ?? "");

  if (title.length < 3) {
    return { error: "Add a title with at least 3 characters." };
  }

  if (!content) {
    return { error: "The article needs some content before saving." };
  }

  const supabase = await createClient();

  let existing: { id: string; published_at: string | null } | null = null;

  if (id) {
    const { data } = await supabase
      .from("articles")
      .select("id, published_at")
      .eq("id", id)
      .maybeSingle();

    if (!data) {
      return { error: "This article no longer exists." };
    }

    existing = data as { id: string; published_at: string | null };
  }

  const baseSlug =
    slugify(String(formData.get("slug") ?? "")) ||
    slugify(title) ||
    `article-${Date.now().toString(36)}`;

  let slug = baseSlug;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: clash } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!clash || (existing && clash.id === existing.id)) {
      break;
    }

    slug = `${baseSlug}-${attempt + 2}`;
  }

  const publishedAt =
    status === "published"
      ? (existing?.published_at ?? new Date().toISOString())
      : null;

  const payload = {
    title,
    slug,
    summary: summaryInput || excerpt(stripHtml(content), 160),
    content,
    category_id: categoryId || null,
    status,
    published_at: publishedAt,
  };

  let articleId = id;

  if (id) {
    const { error } = await supabase
      .from("articles")
      .update(payload)
      .eq("id", id);

    if (error) {
      return { error: "Could not save the article. Please try again." };
    }
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert({ ...payload, author_id: user.id })
      .select("id")
      .single();

    if (error || !data) {
      return { error: "Could not create the article. Please try again." };
    }

    articleId = data.id as string;
  }

  const tagError = await syncTags(supabase, articleId, tagsInput);
  if (tagError) {
    return { error: tagError };
  }

  revalidatePath("/kb", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/articles");

  redirect("/admin/articles");
}

export async function deleteArticle(formData: FormData) {
  await requireHr();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("articles").delete().eq("id", id);

  revalidatePath("/kb", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
}
