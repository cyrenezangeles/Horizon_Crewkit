import { Badge, type BadgeTone } from "@/frontend/components/ui";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/backend/types";

const statusTones: Record<TicketStatus, BadgeTone> = {
  open: "amber",
  in_progress: "blue",
  resolved: "emerald",
  closed: "slate",
};

const priorityTones: Record<TicketPriority, BadgeTone> = {
  low: "slate",
  normal: "blue",
  high: "amber",
  urgent: "rose",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={statusTones[status]}>{TICKET_STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge tone={priorityTones[priority]}>
      {TICKET_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return <Badge tone="violet">{TICKET_CATEGORY_LABELS[category]}</Badge>;
}
