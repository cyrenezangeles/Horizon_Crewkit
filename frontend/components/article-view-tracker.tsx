"use client";

import { useEffect, useRef } from "react";
import { trackArticleView } from "@/backend/actions/kb";

export function ArticleViewTracker({ articleId }: { articleId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) {
      return;
    }

    tracked.current = true;
    void trackArticleView(articleId);
  }, [articleId]);

  return null;
}
