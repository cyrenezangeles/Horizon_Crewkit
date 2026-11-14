"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { submitArticleFeedback } from "@/backend/actions/kb";

export function ArticleFeedback({ articleId }: { articleId: string }) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(helpful: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await submitArticleFeedback(articleId, helpful);
      if (result.ok) {
        setSubmitted(helpful);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4" />
        Thanks for the feedback — it helps HR keep this article sharp.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">
          Was this article helpful?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60",
          )}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="h-3.5 w-3.5" />
          )}
          Yes
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Not really
        </button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
