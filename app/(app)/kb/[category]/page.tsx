import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { ArticleCard } from "@/frontend/components/article-card";
import { CategoryIcon } from "@/frontend/components/category-icon";
import { Badge, Button, ButtonLink, EmptyState } from "@/frontend/components/ui";
import {
  getCategories,
  getTags,
  listArticles,
  normalizeSort,
} from "@/backend/data/kb";
import { cn } from "@/frontend/lib/utils";

type CategoryParams = {
  q?: string;
  tag?: string;
  sort?: string;
};

function buildHref(
  category: string,
  base: { q: string; tag: string; sort: string },
  overrides: Partial<{ q: string; tag: string; sort: string }> = {},
): string {
  const next = { ...base, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.tag) params.set("tag", next.tag);
  if (next.sort && next.sort !== "recent") params.set("sort", next.sort);

  const query = params.toString();
  return (query ? `/kb/${category}?${query}` : `/kb/${category}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === categorySlug);

  return {
    title: category?.name ?? "Category",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<CategoryParams>;
}) {
  const [{ category: categorySlug }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const categories = await getCategories();
  const category = categories.find((item) => item.slug === categorySlug);

  if (!category) {
    notFound();
  }

  const base = {
    q: (query.q ?? "").trim(),
    tag: query.tag ?? "",
    sort: normalizeSort(query.sort),
  };

  const [tags, articles] = await Promise.all([
    getTags(),
    listArticles({
      categorySlug: category.slug,
      q: base.q || undefined,
      tagSlug: base.tag || undefined,
      sort: normalizeSort(base.sort),
    }),
  ]);

  const activeTag = tags.find((tag) => tag.slug === base.tag);

  return (
    <div className="space-y-7">
      <Link
        href="/kb"
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All categories
      </Link>

      <section className="surface-strong relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_16px_30px_-16px_rgba(37,99,235,0.9)]">
            <CategoryIcon name={category.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <Badge tone="blue">Category</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              {category.description}
            </p>
          </div>
          <ButtonLink href="/tickets/new" variant="secondary" size="sm">
            Ask HR
            <ArrowRight className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>

        <form action={`/kb/${category.slug}`} className="relative mt-6 flex flex-col gap-2 sm:flex-row">
          {base.tag ? <input type="hidden" name="tag" value={base.tag} /> : null}
          {base.sort !== "recent" ? (
            <input type="hidden" name="sort" value={base.sort} />
          ) : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={base.q}
              placeholder={`Search ${category.name.toLowerCase()}...`}
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-11 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300"
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            Search
          </Button>
        </form>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tags
        </span>
        {tags.map((tag) => {
          const active = tag.slug === base.tag;
          return (
            <Link
              key={tag.id}
              href={buildHref(category.slug, base, {
                tag: active ? "" : tag.slug,
              })}
              className={cn(
                "focus-ring rounded-full border px-2.5 py-1 text-xs font-medium transition",
                active
                  ? "border-blue-300 bg-blue-600 text-white"
                  : "border-slate-200 bg-white/70 text-slate-600 hover:border-blue-200 hover:text-blue-700",
              )}
            >
              #{tag.name}
            </Link>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {base.q
                ? `Results for "${base.q}"`
                : activeTag
                  ? `Tagged "${activeTag.name}"`
                  : `${articles.length} ${articles.length === 1 ? "article" : "articles"}`}
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by{" "}
              {base.sort === "popular"
                ? "most viewed"
                : base.sort === "az"
                  ? "title"
                  : "most recently updated"}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/70 p-1">
            {[
              { value: "recent", label: "Recent" },
              { value: "popular", label: "Popular" },
              { value: "az", label: "A-Z" },
            ].map((option) => (
              <Link
                key={option.value}
                href={buildHref(category.slug, base, { sort: option.value })}
                className={cn(
                  "focus-ring rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  base.sort === option.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-white hover:text-slate-800",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Nothing here yet"
            description="No articles in this category matched the current filters. Clear them, or ask HR directly."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <ButtonLink
                  href={`/kb/${category.slug}`}
                  variant="secondary"
                  size="sm"
                >
                  Clear filters
                </ButtonLink>
                <ButtonLink href="/tickets/new" size="sm">
                  Open a ticket
                </ButtonLink>
              </div>
            }
          />
        )}
      </section>
    </div>
  );
}
