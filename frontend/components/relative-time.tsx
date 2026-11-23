"use client";

import { useEffect, useState } from "react";
import { formatDate, timeAgo } from "@/frontend/lib/utils";

export function RelativeTime({
  value,
}: {
  value: string | Date | null | undefined;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setLabel(timeAgo(value));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [value]);

  return <>{label ?? formatDate(value)}</>;
}
