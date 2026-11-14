"use server";

import { createClient } from "@/backend/supabase/server";
import { requireUser } from "@/backend/auth";

export async function trackArticleView(articleId: string) {
  if (!articleId) {
    return;
  }

  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("increment_article_view", { p_article_id: articleId });
}

export async function submitArticleFeedback(
  articleId: string,
  helpful: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("article_feedback").upsert(
    {
      article_id: articleId,
      user_id: user.id,
      helpful,
    },
    { onConflict: "article_id,user_id" },
  );

  if (error) {
    return {
      ok: false,
      error: "We could not save your feedback. Please try again.",
    };
  }

  return { ok: true };
}
