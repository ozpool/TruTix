import { cn } from "../../lib/cn";

type Tone = "success" | "warn" | "danger" | "info";

const tones: Record<Tone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  danger: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  info: "border-brand-500/40 bg-brand-500/10 text-brand-200",
};

/// An inline status banner with an aria-live region, so transaction and gate
/// results are announced to screen readers as they arrive.
export function TxStatus({
  tone = "info",
  children,
  assertive,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  assertive?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      className={cn("animate-pop-in rounded-xl border px-4 py-3 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}
