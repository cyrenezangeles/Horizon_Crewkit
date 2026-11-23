import "server-only";

import { getCacheNow } from "@/backend/cache-time";
import { createClient } from "@/backend/supabase/server";
import type {
  ArticleDetail,
  ArticleListItem,
  Category,
  Tag,
} from "@/backend/types";

export type ArticleSort = "recent" | "popular" | "az";

const LIST_SELECT =
  "id, slug, title, summary, view_count, status, published_at, updated_at, categories!inner(name, slug), article_tags(tags(name, slug))";

const DETAIL_SELECT =
  "id, slug, title, summary, content, category_id, author_id, view_count, status, published_at, created_at, updated_at, categories!inner(name, slug), article_tags(tags(name, slug))";

const ADMIN_DETAIL_SELECT =
  "id, slug, title, summary, content, category_id, author_id, view_count, status, published_at, created_at, updated_at, categories(name, slug), article_tags(tags(name, slug))";

export function normalizeSort(value?: string): ArticleSort {
  return value === "popular" || value === "az" ? value : "recent";
}

const REFERENCE_TTL_MS = 5 * 60_000;
let categoriesCache: { value: Category[]; expiresAt: number } | null = null;
let tagsCache: { value: Tag[]; expiresAt: number } | null = null;

export async function getCategories(): Promise<Category[]> {
  const now = await getCacheNow();
  const supabase = await createClient();

  if (categoriesCache && categoriesCache.expiresAt > now) {
    return categoriesCache.value;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load categories: ${error.message}`);
  }

  const categories = (data as Category[]) ?? [];
  categoriesCache = {
    value: categories,
    expiresAt: now + REFERENCE_TTL_MS,
  };

  return categories;
}

export function invalidateCategoriesCache() {
  categoriesCache = null;
}

export async function getTags(): Promise<Tag[]> {
  const now = await getCacheNow();
  const supabase = await createClient();

  if (tagsCache && tagsCache.expiresAt > now) {
    return tagsCache.value;
  }

  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load tags: ${error.message}`);
  }

  const tags = (data as Tag[]) ?? [];
  tagsCache = { value: tags, expiresAt: now + REFERENCE_TTL_MS };

  return tags;
}

export async function listArticles({
  q,
  categorySlug,
  tagSlug,
  sort = "recent",
  limit = 60,
}: {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  sort?: ArticleSort;
  limit?: number;
}): Promise<ArticleListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published");

  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  if (tagSlug) {
    const { data: tagged, error: tagError } = await supabase
      .from("article_tags")
      .select("article_id, tags!inner(slug)")
      .eq("tags.slug", tagSlug);

    if (tagError) {
      throw new Error(`Could not filter by tag: ${tagError.message}`);
    }

    const ids = (tagged ?? []).map((row) => row.article_id as string);
    if (ids.length === 0) {
      return [];
    }
    query = query.in("id", ids);
  }

  if (sort === "az") {
    query = query.order("title", { ascending: true });
  } else if (sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    throw new Error(`Could not load articles: ${error.message}`);
  }

  return (data as unknown as ArticleListItem[]) ?? [];
}

export async function getArticleBySlug(
  slug: string,
  categorySlug?: string,
): Promise<ArticleDetail | null> {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .eq("status", "published");

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Could not load article: ${error.message}`);
  }

  return (data as unknown as ArticleDetail | null) ?? null;
}

export async function getRelatedArticles(
  categoryId: string | null,
  excludeId: string,
): Promise<ArticleListItem[]> {
  if (!categoryId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) {
    return [];
  }

  return (data as unknown as ArticleListItem[]) ?? [];
}


export async function listArticlesForAdmin(): Promise<ArticleListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(LIST_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load articles: ${error.message}`);
  }

  return (data as unknown as ArticleListItem[]) ?? [];
}

export async function getArticleById(
  id: string,
): Promise<ArticleDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ADMIN_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load article: ${error.message}`);
  }

  return (data as unknown as ArticleDetail | null) ?? null;
}
