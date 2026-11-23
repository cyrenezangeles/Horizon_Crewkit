import type { Metadata } from "next";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  CircleDot,
  Inbox,
  Loader,
  Plus,
  UserRound,
} from "lucide-react";
import { ButtonLink, EmptyState } from "@/frontend/components/ui";
import {
  CategoryBadge,
  PriorityBadge,
  StatusBadge,
} from "@/frontend/components/ticket-badges";
import { requireUser } from "@/backend/auth";
import { getTicketStatusCounts, listTickets } from "@/backend/data/tickets";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type TicketStatus,
} from "@/backend/types";
import { cn } from "@/frontend/lib/utils";
import { RelativeTime } from "@/frontend/components/relative-time";

export const metadata: Metadata = {
  title: "Tickets",
};

const statusIcons = {
  open: CircleDot,
  in_progress: Loader,
  resolved: CheckCircle2,
  closed: Archive,
} as const;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeStatus = TICKET_STATUSES.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined;

  const [user, tickets, counts] = await Promise.all([
    requireUser(),
    listTickets({ status: activeStatus, limit: 100 }),
    getTicketStatusCounts(),
  ]);

  const total = TICKET_STATUSES.reduce(
    (accumulator, status) => accumulator + counts[status],
    0,
  );

  const isHr = user.role === "hr";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Support
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {isHr ? "Support tickets" : "My tickets"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            {isHr
              ? "Every request in one queue. Update status, priority, and assignment as you work through them."
              : "Track the requests you have opened and keep the conversation going."}
          </p>
        </div>
        {isHr ? null : (
          <ButtonLink href="/tickets/new">
            <Plus className="h-4 w-4" />
            New ticket
          </ButtonLink>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TICKET_STATUSES.map((status) => {
          const Icon = statusIcons[status];
          const active = activeStatus === status;
          const href = (`/tickets?status=${status}`);

          return (
            <Link
              key={status}
              href={href}
              className={cn(
                "focus-ring surface group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-blue-200",
                active && "border-blue-300 bg-blue-50/80 ring-1 ring-blue-200",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xl font-semibold tracking-tight text-slate-900">
                  {counts[status]}
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  {TICKET_STATUS_LABELS[status]}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white/70 p-1">
        <Link
          href={"/tickets"}
          className={cn(
            "focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold transition",
            !activeStatus
              ? "bg-blue-600 text-white"
              : "text-slate-500 hover:bg-white hover:text-slate-800",
          )}
        >
          All ({total})
        </Link>
        {TICKET_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/tickets?status=${status}`}
            className={cn(
              "focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              activeStatus === status
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-white hover:text-slate-800",
            )}
          >
            {TICKET_STATUS_LABELS[status]} ({counts[status]})
          </Link>
        ))}
      </div>

      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="focus-ring surface group block p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_45px_-30px_rgba(37,99,235,0.5)] sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                  #{ticket.ticket_number}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
                <span className="ml-auto text-[11px] text-slate-400">
                  Updated <RelativeTime value={ticket.updated_at} />
                </span>
              </div>

              <h2 className="mt-2.5 text-base font-semibold leading-snug tracking-tight text-slate-900 transition group-hover:text-blue-700">
                {ticket.subject}
              </h2>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {ticket.description || "No description provided."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {isHr
                    ? (ticket.requester?.full_name ?? "Unknown requester")
                    : "Requested by you"}
                </span>
                <span>
                  Assigned to{" "}
                  <span className="font-medium text-slate-500">
                    {ticket.assignee?.full_name ?? "Unassigned"}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={activeStatus ? "No tickets with that status" : "No tickets yet"}
          description={
            activeStatus
              ? "Try another status filter or view all tickets."
              : isHr
                ? "There are no submitted tickets in the queue right now."
                : "When you need help from HR, open a ticket and it will show up here."
          }
          action={
            activeStatus || !isHr ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {activeStatus ? (
                  <ButtonLink href={"/tickets"} variant="secondary" size="sm">
                    View all
                  </ButtonLink>
                ) : null}
                {isHr ? null : (
                  <ButtonLink href="/tickets/new" size="sm">
                    <Plus className="h-4 w-4" />
                    Open a ticket
                  </ButtonLink>
                )}
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
