"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TriangleAlert,
  X,
} from "lucide-react";
import { login, type LoginState } from "@/backend/actions/login";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [dismissedState, setDismissedState] = useState<LoginState | null>(null);

  const toast = state.error && state !== dismissedState ? state.error : null;

  useEffect(() => {
    if (!state.error) {
      return;
    }
    const timer = window.setTimeout(() => setDismissedState(state), 10000);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <>
      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed left-1/2 top-4 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg shadow-rose-200/50"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setDismissedState(state)}
            className="rounded-md p-0.5 text-rose-400 transition hover:text-rose-600"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-400"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(37,99,235,0.8)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <p className="text-center text-xs text-slate-500">
          Access is limited to approved team members. Ask HR if you need an
          account.
        </p>
      </form>
    </>
  );
}
