"use client";

import { Trash2 } from "lucide-react";
import { deleteArticle } from "@/backend/actions/articles";

export function DeleteArticleButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deleteArticle}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete "${title}"? This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Delete ${title}`}
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
