import { type ReactNode } from "react";

/// A friendly placeholder for empty lists — title, hint, and an optional CTA —
/// so blank screens guide the user instead of looking broken.
export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-12 text-center">
      {icon && <div className="text-brand-400">{icon}</div>}
      <p className="font-display text-lg text-slate-200">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
