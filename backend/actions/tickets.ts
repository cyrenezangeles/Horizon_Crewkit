"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/supabase/server";
import { requireHr, requireUser } from "@/backend/auth";
import { uploadTicketFiles } from "@/backend/storage";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/backend/types";

export type TicketFormState = {
  error?: string;
};

export type ReplyState = {
  error?: string;
  ok?: boolean;
  warning?: string;
};

function parseCategory(value: FormDataEntryValue | null): TicketCategory {
  return TICKET_CATEGORIES.includes(value as TicketCategory)
    ? (value as TicketCategory)
    : "general";
}

function parsePriority(value: FormDataEntryValue | null): TicketPriority {
  return TICKET_PRIORITIES.includes(value as TicketPriority)
    ? (value as TicketPriority)
    : "normal";
}

function parseStatus(value: FormDataEntryValue | null): TicketStatus {
  return TICKET_STATUSES.includes(value as TicketStatus)
    ? (value as TicketStatus)
    : "open";
}

function filesFrom(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
}

export async function createTicket(
  _previousState: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const user = await requireUser();

  if (user.role === "hr") {
    return { error: "HR accounts manage submitted tickets." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = parseCategory(formData.get("category"));
  const priority = parsePriority(formData.get("priority"));

  if (subject.length < 4) {
    return { error: "Give your ticket a short, descriptive subject." };
  }

  if (description.length < 10) {
    return { error: "Add a few details so HR can help faster." };
  }

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      subject,
      description,
      category,
      priority,
      requester_id: user.id,
    })
    .select("id")
    .single();

  if (error || !ticket) {
    return { error: "We could not create your ticket. Please try again." };
  }

  let uploadFailed = false;

  try {
    await uploadTicketFiles({
      supabase,
      ticketId: ticket.id as string,
      files: filesFrom(formData),
      userId: user.id,
    });
  } catch {
    uploadFailed = true;
  }

  revalidatePath("/tickets");
  redirect(
    `/tickets/${ticket.id}${uploadFailed ? "?notice=attachments" : ""}`,
  );
}

export async function addMessage(
  _previousState: ReplyState,
  formData: FormData,
): Promise<ReplyState> {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const files = filesFrom(formData);

  if (!ticketId) {
    return { error: "Missing ticket." };
  }

  if (!body && files.length === 0) {
    return { error: "Write a reply or attach a file." };
  }

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) {
    return { error: "This ticket is not available." };
  }

  const { data: message, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      body: body || "Attached files.",
    })
    .select("id")
    .single();

  if (error || !message) {
    return { error: "We could not post your reply. Please try again." };
  }

  let warning: string | undefined;

  try {
    await uploadTicketFiles({
      supabase,
      ticketId,
      messageId: message.id as string,
      files,
      userId: user.id,
    });
  } catch {
    warning = "Reply posted, but some attachments could not be uploaded.";
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");

  return { ok: true, warning };
}

export async function updateTicket(formData: FormData) {
  await requireHr();

  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) {
    return;
  }

  const status = parseStatus(formData.get("status"));
  const priority = parsePriority(formData.get("priority"));
  const assigneeRaw = String(formData.get("assignee_id") ?? "");
  const assigneeId =
    assigneeRaw && assigneeRaw !== "unassigned" ? assigneeRaw : null;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tickets")
    .select("resolved_at")
    .eq("id", ticketId)
    .maybeSingle();

  const isDone = status === "resolved" || status === "closed";
  const resolvedAt = isDone
    ? (existing?.resolved_at ?? new Date().toISOString())
    : null;

  await supabase
    .from("tickets")
    .update({
      status,
      priority,
      assignee_id: assigneeId,
      resolved_at: resolvedAt,
    })
    .eq("id", ticketId);

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  revalidatePath("/admin");
}
