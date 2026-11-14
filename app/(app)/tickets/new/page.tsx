import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3, ShieldCheck } from "lucide-react";
import { requireUser } from "@/backend/auth";
import { TicketForm } from "@/frontend/components/ticket-form";

export const metadata: Metadata = {
  title: "New ticket",
};

export default async function NewTicketPage() {
  const user = await requireUser();

  if (user.role === "hr") {
    redirect("/tickets");
  }

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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Open a ticket
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Give HR enough context to act on the first reply. You can keep adding
          messages and files once the ticket is open.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <TicketForm />

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              Before you submit
            </h2>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-500">
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                Search the knowledge base first - most policy questions already
                have an article.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                Include dates, ticket numbers, or tool names so HR can trace
                things quickly.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                Avoid sharing passwords or sensitive personal data in
                attachments.
              </li>
            </ul>
          </div>

          <div className="surface p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              What happens next
            </h2>
            <ol className="mt-2 space-y-2 text-xs leading-relaxed text-slate-500">
              <li>1. HR reviews the ticket and may assign it to a specialist.</li>
              <li>2. You get replies in the ticket thread.</li>
              <li>3. HR marks it resolved once you are unblocked.</li>
            </ol>
          </div>

          <Link
            href="/kb"
            className="focus-ring surface flex items-center gap-3 p-4 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            <BookOpen className="h-4 w-4 text-blue-500" />
            Browse the knowledge base
          </Link>
        </aside>
      </div>
    </div>
  );
}
