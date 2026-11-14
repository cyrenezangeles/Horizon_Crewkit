import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
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

export const metadata: Metadata = {
  title: "Knowledge base",
};

type KbParams = {
  q?: string;
  category?: string;
  tag?: string;
  sort?: string;
};

type FilterBase = {
  q: string;
  category: string;
  tag: string;
  sort: string;
};

function buildHref(
  base: FilterBase,
  overrides: Partial<FilterBase> = {},
): string {
  const next = { ...base, ...overrides };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.tag) params.set("tag", next.tag);
  if (next.sort && next.sort !== "recent") params.set("sort", next.sort);

  const query = params.toString();
  return (query ? `/kb?${query}` : "/kb");
}

const sortOptions = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Most viewed" },
  { value: "az", label: "A-Z" },
] as const;

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<KbParams>;
}) {
  const params = await searchParams;
  const base: FilterBase = {
    q: (params.q ?? "").trim(),
    category: params.category ?? "",
    tag: params.tag ?? "",
    sort: normalizeSort(params.sort),
  };

  const [categories, tags, articles] = await Promise.all([
    getCategories(),
    getTags(),
    listArticles({
      q: base.q || undefined,
      categorySlug: base.category || undefined,
      tagSlug: base.tag || undefined,
      sort: normalizeSort(base.sort),
    }),
  ]);

  const activeCategory = categories.find(
    (category) => category.slug === base.category,
  );
  const activeTag = tags.find((tag) => tag.slug === base.tag);
  const hasFilters = Boolean(base.q || base.category || base.tag);

  const heading = base.q
    ? `Results for "${base.q}"`
    : activeCategory
      ? activeCategory.name
      : activeTag
        ? `Tagged "${activeTag.name}"`
        : "Latest articles";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white via-blue-50/80 to-indigo-100/60 p-6 shadow-[0_30px_70px_-40px_rgba(37,99,235,0.55)] sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <Badge tone="blue">
            <Sparkles className="h-3 w-3" />
            Answers first
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            How can we help today?
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Search the knowledge base for policies, tools, and how-tos. If you
            cannot find it, open a ticket and HR will pick it up.
          </p>

          <form
            action="/kb"
            className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            {base.category ? (
              <input type="hidden" name="category" value={base.category} />
            ) : null}
            {base.tag ? (
              <input type="hidden" name="tag" value={base.tag} />
            ) : null}
            {base.sort !== "recent" ? (
              <input type="hidden" name="sort" value={base.sort} />
            ) : null}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={base.q}
                placeholder="Try 'WFH policy', 'expense report', 'VPN'..."
                className="focus-ring w-full rounded-2xl border border-white/80 bg-white/90 py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:border-blue-300"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-2xl">
              Search
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <strong className="font-semibold text-slate-700">
                {articles.length}
              </strong>{" "}
              {articles.length === 1 ? "article" : "articles"}
            </span>
            <span className="hidden h-3 w-px bg-slate-300 sm:block" />
            <span>
              <strong className="font-semibold text-slate-700">
                {categories.length}
              </strong>{" "}
              categories
            </span>
            <span className="hidden h-3 w-px bg-slate-300 sm:block" />
            <span>
              <strong className="font-semibold text-slate-700">
                {tags.length}
              </strong>{" "}
              tags
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Browse
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Categories
            </h2>
          </div>
          {hasFilters ? (
            <Link
              href="/kb"
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-blue-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Link>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const active = category.slug === base.category;
            return (
              <Link
                key={category.id}
                href={buildHref(base, {
                  category: active ? "" : category.slug,
                })}
                className={cn(
                  "focus-ring surface group flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:border-blue-200",
                  active && "border-blue-300 bg-blue-50/80 ring-1 ring-blue-200",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                  )}
                >
                  <CategoryIcon name={category.icon} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {category.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tags
          </span>
          {tags.map((tag) => {
            const active = tag.slug === base.tag;
            return (
              <Link
                key={tag.id}
                href={buildHref(base, { tag: active ? "" : tag.slug })}
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
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              {hasFilters ? "Filtered results" : "Knowledge base"}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {heading}
            </h2>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/70 p-1">
            {sortOptions.map((option) => {
              const active = base.sort === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildHref(base, { sort: option.value })}
                  className={cn(
                    "focus-ring rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-white hover:text-slate-800",
                  )}
                >
                  {option.label}
                </Link>
              );
            })}
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
            title="No articles matched that search"
            description="Try a different phrase, drop the tag filter, or open a ticket and HR will help directly."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <ButtonLink href="/kb" variant="secondary" size="sm">
                  Reset filters
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
