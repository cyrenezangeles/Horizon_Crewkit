import { Download, FileText } from "lucide-react";
import type { TicketAttachment } from "@/backend/types";
import { formatBytes } from "@/frontend/lib/utils";

export function AttachmentList({
  attachments,
  urls,
}: {
  attachments: TicketAttachment[];
  urls: Map<string, string>;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        const url = urls.get(attachment.file_path);

        return (
          <li key={attachment.id}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                download={attachment.file_name}
                className="focus-ring group inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="max-w-48 truncate font-medium">
                  {attachment.file_name}
                </span>
                <span className="shrink-0 text-slate-400">
                  {formatBytes(attachment.file_size)}
                </span>
                <Download className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-blue-500" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                {attachment.file_name} (unavailable)
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
