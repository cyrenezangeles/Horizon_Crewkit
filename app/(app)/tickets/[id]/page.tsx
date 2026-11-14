import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MessageSquare,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { AttachmentList } from "@/frontend/components/ticket-attachments";
import {
  CategoryBadge,
  PriorityBadge,
  StatusBadge,
} from "@/frontend/components/ticket-badges";
import { requireUser } from "@/backend/auth";
import {
  getAttachmentUrls,
  getDirectory,
  getTicket,
  getTicketAttachments,
  getTicketMessages,
} from "@/backend/data/tickets";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketPerson,
} from "@/backend/types";
import { cn, formatDate, initials, timeAgo } from "@/frontend/lib/utils";
import { ReplyForm } from "@/frontend/components/reply-form";
import { TicketControls } from "@/frontend/components/ticket-controls";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return { title: "Ticket" };
  }

  const ticket = await getTicket(id);
  return {
    title: ticket ? `#${ticket.ticket_number} ${ticket.subject}` : "Ticket",
  };
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const user = await requireUser();
  const ticket = await getTicket(id);

  if (!ticket) {
    notFound();
  }

  const [messages, attachments, directory] = await Promise.all([
    getTicketMessages(id),
    getTicketAttachments(id),
    getDirectory(),
  ]);

  const urls = await getAttachmentUrls(attachments);
  const isHr = user.role === "hr";
  const initialAttachments = attachments.filter(
    (attachment) => !attachment.message_id,
  );
  const people: Array<TicketPerson & { id: string }> = Array.from(
    directory,
    ([personId, person]) => ({ id: personId, ...person }),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tickets"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to tickets
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
            #{ticket.ticket_number}
          </span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <CategoryBadge category={ticket.category} />
        </div>

        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
          {ticket.subject}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-blue-500" />
            {ticket.requester?.full_name ?? "Unknown requester"}
            {ticket.requester?.email ? (
              <span className="text-slate-400">({ticket.requester.email})</span>
            ) : null}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
            Opened {formatDate(ticket.created_at)}
          </span>
          <span>Updated {timeAgo(ticket.updated_at)}</span>
        </div>
      </div>

      {query.notice === "attachments" ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Your ticket was created, but one or more attachments could not be
            uploaded. Add them as a reply below.
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="surface-strong p-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Request
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {ticket.description || "No description provided."}
            </p>
            <AttachmentList
              attachments={initialAttachments}
              urls={urls}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Conversation
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {messages.length}
              </span>
            </div>

            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => {
                  const author = directory.get(message.author_id);
                  const isOwn = message.author_id === user.id;
                  const isHrAuthor = author?.role === "hr";
                  const messageAttachments = attachments.filter(
                    (attachment) => attachment.message_id === message.id,
                  );

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        "surface p-5",
                        isHrAuthor && "border-indigo-100 bg-gradient-to-br from-white to-blue-50/40",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                            isHrAuthor ? "bg-indigo-600" : "bg-blue-600",
                          )}
                        >
                          {initials(
                            isOwn
                              ? user.fullName
                              : (author?.full_name ?? "Team member"),
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {isOwn
                              ? "You"
                              : (author?.full_name ?? "Team member")}
                            {isHrAuthor ? (
                              <span className="ml-2 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                                HR
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {timeAgo(message.created_at)} &middot;{" "}
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {message.body}
                      </p>
                      <AttachmentList
                        attachments={messageAttachments}
                        urls={urls}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="surface px-4 py-6 text-center text-sm text-slate-500">
                No replies yet. HR will see your request shortly.
              </p>
            )}

            <div className="surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Add a reply
              </h2>
              <ReplyForm ticketId={ticket.id} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Status</dt>
                <dd className="font-medium text-slate-700">
                  {TICKET_STATUS_LABELS[ticket.status]}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Priority</dt>
                <dd className="font-medium text-slate-700">
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Category</dt>
                <dd className="font-medium text-slate-700">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Requester</dt>
                <dd className="text-right font-medium text-slate-700">
                  {ticket.requester?.full_name ?? "-"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Assignee</dt>
                <dd className="text-right font-medium text-slate-700">
                  {ticket.assignee?.full_name ?? "Unassigned"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-400">Opened</dt>
                <dd className="font-medium text-slate-700">
                  {formatDate(ticket.created_at)}
                </dd>
              </div>
              {ticket.resolved_at ? (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-slate-400">Resolved</dt>
                  <dd className="font-medium text-slate-700">
                    {formatDate(ticket.resolved_at)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {isHr ? <TicketControls ticket={ticket} people={people} /> : null}

          <Link
            href="/tickets"
            className="focus-ring inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All tickets
          </Link>
        </aside>
      </div>
    </div>
  );
}
