import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const TICKET_BUCKET = "crewkit-ticket-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return cleaned.slice(-80) || "file";
}

export async function uploadTicketFiles({
  supabase,
  ticketId,
  messageId,
  files,
  userId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>;
  ticketId: string;
  messageId?: string | null;
  files: File[];
  userId: string;
}) {
  const selected = files.filter((file) => file && file.size > 0);

  if (selected.length > MAX_ATTACHMENTS) {
    throw new Error(`Attach up to ${MAX_ATTACHMENTS} files at a time.`);
  }

  for (const file of selected) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`${file.name} is larger than 10 MB.`);
    }

    const path = `${ticketId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const mimeType = file.type || "application/octet-stream";

    const { error: uploadError } = await supabase.storage
      .from(TICKET_BUCKET)
      .upload(path, file, { contentType: mimeType, upsert: false });

    if (uploadError) {
      throw new Error(`Could not upload ${file.name}.`);
    }

    const { error: insertError } = await supabase
      .from("ticket_attachments")
      .insert({
        ticket_id: ticketId,
        message_id: messageId ?? null,
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: mimeType,
        uploaded_by: userId,
      });

    if (insertError) {
      await supabase.storage.from(TICKET_BUCKET).remove([path]);
      throw new Error(`Could not save ${file.name}.`);
    }
  }
}
