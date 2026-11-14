"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Loader2,
  Paperclip,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/frontend/components/ui";
import { formatBytes } from "@/frontend/lib/utils";
import { addMessage, type ReplyState } from "@/backend/actions/tickets";

const initialState: ReplyState = {};

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(
    addMessage,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      if (summaryRef.current) {
        summaryRef.current.textContent = "";
      }
    }
  }, [state.ok]);

  function updateFileSummary(input: HTMLInputElement) {
    if (!summaryRef.current) {
      return;
    }

    const selected = Array.from(input.files ?? []);
    summaryRef.current.textContent =
      selected.length > 0
        ? `${selected.map((file) => file.name).join(", ")} (${formatBytes(
            selected.reduce((total, file) => total + file.size, 0),
          )})`
        : "";
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />

      <textarea
        name="body"
        rows={4}
        placeholder="Write a reply..."
        className="focus-ring w-full resize-y rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300"
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
          <Paperclip className="h-3.5 w-3.5" />
          Attach files
          <input
            type="file"
            name="files"
            multiple
            className="sr-only"
            onChange={(event) => updateFileSummary(event.currentTarget)}
          />
        </label>

        <span className="text-[11px] text-slate-400">
          Up to 3 files, 10 MB each
        </span>
        <span ref={summaryRef} className="text-[11px] text-slate-500" />

        <Button type="submit" size="sm" disabled={pending} className="ml-auto">
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Post reply
            </>
          )}
        </Button>
      </div>

      {state.error ? (
        <p className="flex items-start gap-1.5 text-xs text-rose-600">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.warning ?? "Reply posted."}
        </p>
      ) : null}
    </form>
  );
}
