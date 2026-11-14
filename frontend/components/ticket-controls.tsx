import { ShieldCheck } from "lucide-react";
import { Button } from "@/frontend/components/ui";
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type TicketPerson,
  type TicketWithPeople,
} from "@/backend/types";
import { updateTicket } from "@/backend/actions/tickets";

export function TicketControls({
  ticket,
  people,
}: {
  ticket: TicketWithPeople;
  people: Array<TicketPerson & { id: string }>;
}) {
  const assignees = people.filter((person) => person.role === "hr");

  return (
    <form action={updateTicket} className="surface space-y-3 p-5">
      <input type="hidden" name="ticketId" value={ticket.id} />

      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">HR controls</h2>
          <p className="text-[11px] text-slate-400">Visible to HR only</p>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="status" className="text-xs font-medium text-slate-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={ticket.status}
          className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-blue-300"
        >
          {TICKET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TICKET_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="priority" className="text-xs font-medium text-slate-600">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={ticket.priority}
          className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-blue-300"
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {TICKET_PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="assignee_id"
          className="text-xs font-medium text-slate-600"
        >
          Assignee
        </label>
        <select
          id="assignee_id"
          name="assignee_id"
          defaultValue={ticket.assignee_id ?? "unassigned"}
          className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-blue-300"
        >
          <option value="unassigned">Unassigned</option>
          {assignees.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name || person.email}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="sm" className="w-full">
        Save changes
      </Button>
    </form>
  );
}
