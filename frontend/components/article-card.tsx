import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { Badge } from "@/frontend/components/ui";
import { RelativeTime } from "@/frontend/components/relative-time";
import type { ArticleListItem } from "@/backend/types";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  const category = article.categories;
  const tags = (article.article_tags ?? [])
    .map((link) => link.tags)
    .filter((tag): tag is { name: string; slug: string } => Boolean(tag));

  const href = `/kb/${category?.slug ?? "all"}/${article.slug}`;

  return (
    <Link
      href={href}
      className="surface group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_50px_-28px_rgba(37,99,235,0.5)]"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="blue">{category?.name ?? "Article"}</Badge>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Eye className="h-3.5 w-3.5" />
          {article.view_count}
        </span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 transition group-hover:text-blue-700">
          {article.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-blue-500" />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
        {article.summary}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag.slug}
            className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[11px] font-medium text-slate-500"
          >
            #{tag.name}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">
          Updated <RelativeTime value={article.updated_at} />
        </span>
      </div>
    </Link>
  );
}
