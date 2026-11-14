"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  FilePlus2,
  Loader2,
  Paperclip,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Button, ButtonLink } from "@/frontend/components/ui";
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
} from "@/backend/types";
import { formatBytes } from "@/frontend/lib/utils";
import { createTicket, type TicketFormState } from "@/backend/actions/tickets";

const initialState: TicketFormState = {};

export function TicketForm() {
  const [state, formAction, pending] = useActionState(
    createTicket,
    initialState,
  );
  const [files, setFiles] = useState<File[]>([]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="surface-strong space-y-5 p-6">
        <div className="space-y-1.5">
          <label htmlFor="subject" className="text-sm font-medium text-slate-700">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            required
            maxLength={160}
            placeholder="Short summary, e.g. 'Missing March expense reimbursement'"
            className="focus-ring w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="category"
              className="text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue="general"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-300"
            >
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {TICKET_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="priority"
              className="text-sm font-medium text-slate-700"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="normal"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-300"
            >
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {TICKET_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="text-sm font-medium text-slate-700"
          >
            What do you need help with?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={7}
            placeholder="Share the details, what you have already tried, and any deadlines."
            className="focus-ring w-full resize-y rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300"
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Attachments
          </span>
          <label className="focus-ring flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-5 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
            <Paperclip className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              Choose files
            </span>
            <span className="text-[11px] text-slate-400">
              Up to 3 files, 10 MB each. Screenshots help a lot.
            </span>
            <input
              type="file"
              name="files"
              multiple
              className="sr-only"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>

          {files.length > 0 ? (
            <ul className="space-y-1.5">
              {files.map((file) => (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <FilePlus2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <span className="shrink-0 text-slate-400">
                    {formatBytes(file.size)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {state.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ButtonLink href="/tickets" variant="ghost" size="sm">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit ticket
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        By submitting, you agree to be contacted at your work email. Need
        general info first?{" "}
        <Link href="/kb" className="font-medium text-blue-600 hover:underline">
          Search the knowledge base
        </Link>
        .
      </p>
    </form>
  );
}
