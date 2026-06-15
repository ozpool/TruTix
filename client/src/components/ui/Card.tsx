import { type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

/// A surface panel. `interactive` adds a hover lift + brand border for cards
/// that act as links or buttons.
export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-700 bg-ink-900/70 p-5 shadow-card backdrop-blur-sm",
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/60 hover:shadow-glow",
        className,
      )}
      {...rest}
    />
  );
}
