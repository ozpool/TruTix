import { type ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "brand" | "citrus" | "success" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-700 text-slate-300 ring-1 ring-inset ring-ink-600",
  brand: "bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-500/30",
  citrus: "bg-citrus-500/15 text-citrus-300 ring-1 ring-inset ring-citrus-500/30",
  success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
};

/// A small status chip used for tiers, event ids, and on-chain states.
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
