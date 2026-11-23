import "server-only";

import { getCacheNow } from "@/backend/cache-time";
import { createClient } from "@/backend/supabase/server";
import { TICKET_BUCKET } from "@/backend/storage";
import {
  TICKET_STATUSES,
  type Ticket,
  type TicketAttachment,
  type TicketMessage,
  type TicketPerson,
  type TicketStatus,
  type TicketWithPeople,
} from "@/backend/types";

const TICKET_SELECT =
  "id, ticket_number, subject, description, category, priority, status, requester_id, assignee_id, created_at, updated_at, resolved_at";

const DIRECTORY_TTL_MS = 60_000;
let directoryCache: {
  value: Map<string, TicketPerson>;
  expiresAt: number;
} | null = null;

export async function getDirectory(): Promise<Map<string, TicketPerson>> {
  const now = await getCacheNow();
  const supabase = await createClient();

  if (directoryCache && directoryCache.expiresAt > now) {
    return directoryCache.value;
  }

  const { data, error } = await supabase.rpc("member_directory");

  if (error) {
    return new Map();
  }

  const directory = new Map<string, TicketPerson>();

  type DirectoryRow = TicketPerson & { id: string };

  for (const row of (data ?? []) as DirectoryRow[]) {
    directory.set(row.id, {
      full_name: row.full_name,
      email: row.email,
      role: row.role,
    });
  }

  directoryCache = {
    value: directory,
    expiresAt: now + DIRECTORY_TTL_MS,
  };

  return directory;
}

function withPeople(
  ticket: Ticket,
  directory: Map<string, TicketPerson>,
): TicketWithPeople {
  return {
    ...ticket,
    requester: directory.get(ticket.requester_id) ?? null,
    assignee: ticket.assignee_id
      ? (directory.get(ticket.assignee_id) ?? null)
      : null,
  };
}

export async function listTickets({
  status,
  requesterId,
  limit = 200,
}: {
  status?: TicketStatus;
  requesterId?: string;
  limit?: number;
} = {}): Promise<TicketWithPeople[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (requesterId) {
    query = query.eq("requester_id", requesterId);
  }

  const [{ data, error }, directory] = await Promise.all([
    query,
    getDirectory(),
  ]);

  if (error) {
    throw new Error(`Could not load tickets: ${error.message}`);
  }

  return ((data ?? []) as Ticket[]).map((ticket) =>
    withPeople(ticket, directory),
  );
}

export async function getTicketStatusCounts(): Promise<
  Record<TicketStatus, number>
> {
  const supabase = await createClient();

  const entries = await Promise.all(
    TICKET_STATUSES.map(async (status) => {
      const { count } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<TicketStatus, number>;
}

export function countResolvedSince(
  tickets: TicketWithPeople[],
  days: number,
  now: number,
): number {
  const cutoff = now - days * 86_400_000;

  return tickets.filter((ticket) => {
    if (!ticket.resolved_at) {
      return false;
    }
    return new Date(ticket.resolved_at).getTime() >= cutoff;
  }).length;
}

export async function getTicket(id: string): Promise<TicketWithPeople | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load ticket: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const directory = await getDirectory();
  return withPeople(data as Ticket, directory);
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_messages")
    .select("id, ticket_id, author_id, body, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load messages: ${error.message}`);
  }

  return (data as TicketMessage[]) ?? [];
}

export async function getTicketAttachments(
  ticketId: string,
): Promise<TicketAttachment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_attachments")
    .select(
      "id, ticket_id, message_id, file_path, file_name, file_size, mime_type, uploaded_by, created_at",
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load attachments: ${error.message}`);
  }

  return (data as TicketAttachment[]) ?? [];
}

export async function getAttachmentUrls(
  attachments: TicketAttachment[],
): Promise<Map<string, string>> {
  if (attachments.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(TICKET_BUCKET)
    .createSignedUrls(
      attachments.map((attachment) => attachment.file_path),
      60 * 60,
    );

  const urls = new Map<string, string>();

  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) {
      urls.set(item.path, item.signedUrl);
    }
  }

  return urls;
}
