import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Badge, ButtonLink } from "@/frontend/components/ui";
import { ArticleContent } from "@/frontend/components/article-content";
import { CategoryIcon } from "@/frontend/components/category-icon";
import {
  getArticleBySlug,
  getCategories,
  getRelatedArticles,
} from "@/backend/data/kb";
import { formatDate } from "@/frontend/lib/utils";
import { RelativeTime } from "@/frontend/components/relative-time";
import { ArticleFeedback } from "@/frontend/components/feedback";
import { ArticleViewTracker } from "@/frontend/components/article-view-tracker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getArticleBySlug(slug, category);

  return {
    title: article?.title ?? "Article",
    description: article?.summary,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categorySlug, slug } = await params;
  const article = await getArticleBySlug(slug, categorySlug);

  if (!article) {
    notFound();
  }

  const [related, categories] = await Promise.all([
    getRelatedArticles(article.category_id, article.id),
    getCategories(),
  ]);

  const category = categories.find((item) => item.slug === categorySlug);
  const tags = (article.article_tags ?? [])
    .map((link) => link.tags)
    .filter((tag): tag is { name: string; slug: string } => Boolean(tag));
  const words = article.content.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="space-y-6">
      <ArticleViewTracker articleId={article.id} />

      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
        <Link href="/kb" className="focus-ring rounded px-1 py-0.5 transition hover:text-blue-700">
          Knowledge base
        </Link>
        <span>/</span>
        <Link
          href={`/kb/${categorySlug}`}
          className="focus-ring rounded px-1 py-0.5 transition hover:text-blue-700"
        >
          {category?.name ?? categorySlug}
        </Link>
        <span>/</span>
        <span className="max-w-[16rem] truncate px-1 py-0.5 text-slate-500">
          {article.title}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        <article className="surface-strong overflow-hidden">
          <header className="border-b border-blue-100/80 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/60 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">
                {category ? (
                  <CategoryIcon name={category.icon} className="h-3 w-3" />
                ) : null}
                {category?.name ?? "Article"}
              </Badge>
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200/70"
                >
                  #{tag.name}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              {article.title}
            </h1>
            {article.summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {article.summary}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                Updated <RelativeTime value={article.updated_at} />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                {readingMinutes} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-500" />
                {article.view_count} views
              </span>
              {article.published_at ? (
                <span className="text-slate-400">
                  Published {formatDate(article.published_at)}
                </span>
              ) : null}
            </div>
          </header>

          <div className="p-6 sm:p-8">
            <ArticleContent content={article.content} />

            <div className="mt-8 border-t border-slate-200/80 pt-5">
              <ArticleFeedback articleId={article.id} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Filed under
              </span>
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/kb?tag=${tag.slug}`}
                  className="focus-ring rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_12px_22px_-12px_rgba(37,99,235,0.9)]">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold tracking-tight text-slate-900">
              Still need a hand?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              If this article did not answer your question, open a ticket and
              the HR team will follow up.
            </p>
            <ButtonLink href="/tickets/new" className="mt-4 w-full" size="sm">
              <MessageSquare className="h-4 w-4" />
              Open a ticket
            </ButtonLink>
          </div>

          {related.length > 0 ? (
            <div className="surface p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Keep reading
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
                Related articles
              </h2>
              <div className="mt-3 flex flex-col divide-y divide-slate-100">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/kb/${categorySlug}/${item.slug}`}
                    className="focus-ring group flex items-start gap-2 rounded-lg py-3 transition hover:text-blue-700"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                    <span>
                      <span className="block text-sm font-medium leading-snug text-slate-700 group-hover:text-blue-700">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        Updated <RelativeTime value={item.updated_at} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <Link
            href={`/kb/${categorySlug}`}
            className="focus-ring inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {category?.name ?? "category"}
          </Link>
        </aside>
      </div>
    </div>
  );
}
