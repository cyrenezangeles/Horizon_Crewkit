import { Compass, Search } from "lucide-react";
import { Brand } from "@/frontend/components/brand";
import { ButtonLink } from "@/frontend/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="surface-strong w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Compass className="h-7 w-7" />
        </div>
        <div className="mt-5 flex justify-center">
          <Brand href="/kb" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
          404
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          This page wandered off
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The link may be old, or the article may have moved. Try the knowledge
          base, or open a ticket if you are stuck.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <ButtonLink href="/kb" size="sm">
            <Search className="h-4 w-4" />
            Search the knowledge base
          </ButtonLink>
          <ButtonLink href="/tickets/new" variant="secondary" size="sm">
            Open a ticket
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
