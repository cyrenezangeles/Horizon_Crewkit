export type AppRole = "employee" | "hr";
export type ArticleStatus = "draft" | "published";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory =
  | "general"
  | "payroll"
  | "benefits"
  | "it"
  | "facilities"
  | "other";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
};

export type ArticleTagLink = {
  tags: Pick<Tag, "name" | "slug"> | null;
};

export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  view_count: number;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
  categories: Pick<Category, "name" | "slug"> | null;
  article_tags: ArticleTagLink[] | null;
};

export type ArticleDetail = ArticleListItem & {
  content: string;
  category_id: string | null;
  author_id: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requester_id: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type TicketPerson = {
  full_name: string;
  email: string;
  role: AppRole;
};

export type TicketWithPeople = Ticket & {
  requester: TicketPerson | null;
  assignee: TicketPerson | null;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  general: "General",
  payroll: "Payroll",
  benefits: "Benefits",
  it: "IT & Tools",
  facilities: "Facilities",
  other: "Other",
};

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export const TICKET_PRIORITIES: TicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export const TICKET_CATEGORIES: TicketCategory[] = [
  "general",
  "payroll",
  "benefits",
  "it",
  "facilities",
  "other",
];
