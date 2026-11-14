import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleDot,
  Eye,
  FilePenLine,
  FileText,
  Loader,
  MessageSquare,
  Plus,
  ShieldCheck,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Badge, ButtonLink } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ticket-badges";
import { requireHr } from "@/backend/auth";
import { listArticlesForAdmin } from "@/backend/data/kb";
import { countResolvedSince, listTickets } from "@/backend/data/tickets";
import { createClient } from "@/backend/supabase/server";
import { timeAgo } from "@/frontend/lib/utils";

export const metadata: Metadata = {
  title: "HR dashboard",
};

export default async function AdminPage() {
  await requireHr();

  const supabase = await createClient();
  const [tickets, articles, membersResult, feedbackResult] = await Promise.all([
    listTickets({ limit: 500 }),
    listArticlesForAdmin(),
    supabase.from("members").select("id"),
    supabase.from("article_feedback").select("helpful"),
  ]);

  const counts = {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    in_progress: tickets.filter((ticket) => ticket.status === "in_progress")
      .length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    closed: tickets.filter((ticket) => ticket.status === "closed").length,
  };

  const published = articles.filter(
    (article) => article.status === "published",
  ).length;
  const drafts = articles.length - published;
  const views = articles.reduce(
    (total, article) => total + article.view_count,
    0,
  );

  const feedback = (feedbackResult.data ?? []) as Array<{ helpful: boolean }>;
  const helpful = feedback.filter((entry) => entry.helpful).length;
  const helpfulRate =
    feedback.length > 0 ? Math.round((helpful / feedback.length) * 100) : null;

  const members = membersResult.data?.length ?? 0;
  const recentTickets = tickets.slice(0, 5);
  const recentArticles = articles.slice(0, 5);
  const resolvedThisWeek = countResolvedSince(tickets, 7);

  const stats = [
    {
      label: "Open tickets",
      value: counts.open,
      hint: `${counts.in_progress} in progress`,
      icon: CircleDot,
      href: "/tickets?status=open",
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "Published articles",
      value: published,
      hint: `${drafts} draft${drafts === 1 ? "" : "s"} waiting`,
      icon: BookOpen,
      href: "/admin/articles?status=published",
      className: "bg-blue-50 text-blue-600",
    },
    {
      label: "Article views",
      value: views,
      hint: "all-time reads",
      icon: Eye,
      href: "/admin/articles",
      className: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Resolved this week",
      value: resolvedThisWeek,
      hint: `${counts.closed} closed overall`,
      icon: ShieldCheck,
      href: "/tickets?status=resolved",
      className: "bg-emerald-50 text-emerald-600",
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
            HR dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            A calm overview of the queue and the knowledge base.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/tickets" variant="secondary" size="sm">
            <MessageSquare className="h-4 w-4" />
            View tickets
          </ButtonLink>
          <ButtonLink href="/admin/articles/new" size="sm">
            <Plus className="h-4 w-4" />
            New article
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="focus-ring surface group p-5 transition hover:-translate-y-0.5 hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.className}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-700">{stat.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{stat.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Queue
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Recent tickets
              </h2>
            </div>
            <Link
              href="/tickets"
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTickets.length > 0 ? (
            <div className="mt-2 divide-y divide-slate-100">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="focus-ring group flex items-center gap-3 rounded-lg py-3 transition hover:text-blue-700"
                >
                  <span className="font-mono text-[11px] font-semibold text-slate-400">
                    #{ticket.ticket_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-blue-700">
                      {ticket.subject}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {ticket.requester?.full_name ?? "Unknown requester"} Â·{" "}
                      {timeAgo(ticket.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              The queue is empty. Quiet day.
            </p>
          )}
        </section>

        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Knowledge health
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-slate-500">
                  <Users className="h-4 w-4 text-blue-500" />
                  Members
                </dt>
                <dd className="font-semibold text-slate-900">{members}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-slate-500">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Article views
                </dt>
                <dd className="font-semibold text-slate-900">{views}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-slate-500">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  Helpful feedback
                </dt>
                <dd className="font-semibold text-slate-900">
                  {helpfulRate === null ? "No votes" : `${helpfulRate}%`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-slate-500">
                  <Loader className="h-4 w-4 text-blue-500" />
                  In progress
                </dt>
                <dd className="font-semibold text-slate-900">
                  {counts.in_progress}
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Quick actions
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/admin/articles/new"
                className="focus-ring rounded-xl border border-slate-200 bg-white/70 p-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <FilePenLine className="mb-2 h-4 w-4 text-blue-500" />
                Write article
              </Link>
              <Link
                href="/admin/articles"
                className="focus-ring rounded-xl border border-slate-200 bg-white/70 p-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <FileText className="mb-2 h-4 w-4 text-blue-500" />
                Manage content
              </Link>
              <Link
                href="/tickets?status=open"
                className="focus-ring rounded-xl border border-slate-200 bg-white/70 p-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <MessageSquare className="mb-2 h-4 w-4 text-blue-500" />
                Triage queue
              </Link>
              <Link
                href="/kb"
                className="focus-ring rounded-xl border border-slate-200 bg-white/70 p-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <BookOpen className="mb-2 h-4 w-4 text-blue-500" />
                Open knowledge base
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section className="surface p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Content
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Recently updated articles
            </h2>
          </div>
          <Link
            href="/admin/articles"
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Manage
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentArticles.length > 0 ? (
          <div className="mt-2 divide-y divide-slate-100">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="focus-ring block truncate text-sm font-medium text-slate-800 transition hover:text-blue-700"
                  >
                    {article.title}
                  </Link>
                  <p className="text-[11px] text-slate-400">
                    {article.categories?.name ?? "Uncategorized"} Â· updated{" "}
                    {timeAgo(article.updated_at)}
                  </p>
                </div>
                {article.status === "published" ? (
                  <Badge tone="emerald">Published</Badge>
                ) : (
                  <Badge tone="amber">Draft</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No articles yet. Write the first one.
          </p>
        )}
      </section>
    </div>
  );
}
