import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FileText, PencilLine, Plus } from "lucide-react";
import { Badge, ButtonLink, EmptyState } from "@/frontend/components/ui";
import { requireHr } from "@/backend/auth";
import { listArticlesForAdmin } from "@/backend/data/kb";
import { cn } from "@/frontend/lib/utils";
import { DeleteArticleButton } from "@/frontend/components/delete-article-button";
import { RelativeTime } from "@/frontend/components/relative-time";

export const metadata: Metadata = {
  title: "Manage articles",
};

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireHr();
  const { status } = await searchParams;
  const filter =
    status === "draft" || status === "published" ? status : undefined;

  const articles = await listArticlesForAdmin();
  const counts = {
    all: articles.length,
    published: articles.filter((article) => article.status === "published")
      .length,
    draft: articles.filter((article) => article.status === "draft").length,
  };
  const visible = filter
    ? articles.filter((article) => article.status === filter)
    : articles;

  const tabs = [
    { key: "all", label: "All", count: counts.all, href: "/admin/articles" },
    {
      key: "published",
      label: "Published",
      count: counts.published,
      href: "/admin/articles?status=published",
    },
    {
      key: "draft",
      label: "Drafts",
      count: counts.draft,
      href: "/admin/articles?status=draft",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            HR workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Manage articles
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Create, edit, publish, and retire knowledge base content.
          </p>
        </div>
        <ButtonLink href="/admin/articles/new">
          <Plus className="h-4 w-4" />
          New article
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/70 p-1">
        {tabs.map((tab) => {
          const active = filter === tab.key || (!filter && tab.key === "all");
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-white hover:text-slate-800",
              )}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <div className="surface overflow-hidden">
          {visible.map((article) => {
            const tags = (article.article_tags ?? [])
              .map((link) => link.tags?.name)
              .filter((name): name is string => Boolean(name));

            return (
              <div
                key={article.id}
                className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {article.status === "published" ? (
                      <Badge tone="emerald">Published</Badge>
                    ) : (
                      <Badge tone="amber">Draft</Badge>
                    )}
                    <span className="text-[11px] font-medium text-slate-400">
                      {article.categories?.name ?? "Uncategorized"}
                    </span>
                  </div>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="focus-ring mt-1.5 block text-sm font-semibold leading-snug text-slate-900 transition hover:text-blue-700"
                  >
                    {article.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {article.summary}
                  </p>
                  {tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 sm:w-36 sm:shrink-0 sm:justify-end">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {article.view_count}
                  </span>
                  <span>
                    <RelativeTime value={article.updated_at} />
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:shrink-0">
                  <ButtonLink
                    href={`/admin/articles/${article.id}/edit`}
                    variant="secondary"
                    size="sm"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Edit
                  </ButtonLink>
                  <DeleteArticleButton
                    id={article.id}
                    title={article.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={
            filter === "draft"
              ? "No drafts right now"
              : filter === "published"
                ? "Nothing published yet"
                : "No articles yet"
          }
          description="Start with the questions your team asks most often, then expand from there."
          action={
            <ButtonLink href="/admin/articles/new" size="sm">
              <Plus className="h-4 w-4" />
              Create the first article
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
