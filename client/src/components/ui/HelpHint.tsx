import { useId, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

/// A small "?" affordance that reveals a short explanation on click. Used to
/// guide first-time users through a feature without cluttering the layout. It is
/// keyboard reachable and announces its expanded state for screen readers.
export function HelpHint({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="grid h-5 w-5 place-items-center rounded-full border border-ink-600 bg-ink-850 text-xs font-semibold text-slate-400 transition hover:border-brand-400 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        ?
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-1/2 top-7 z-40 w-64 -translate-x-1/2 rounded-xl border border-ink-600 bg-ink-900 p-3 text-left text-xs font-normal leading-relaxed text-slate-300 shadow-lg"
        >
          <span className="mb-1 block font-semibold text-slate-100">{label}</span>
          {children}
        </span>
      )}
    </span>
  );
}
