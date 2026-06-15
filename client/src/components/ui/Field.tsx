import { type ReactNode, useId } from "react";
import { cn } from "../../lib/cn";

export const controlClass =
  "w-full rounded-xl border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-slate-100 " +
  "placeholder:text-slate-500 transition focus:border-brand-400 focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-ink-950";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  /// Render prop receives wiring (id + aria attributes) for the control so the
  /// label, hint, and error are programmatically associated for screen readers.
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
}

/// A labelled form field. Owns the label/hint/error markup and the a11y wiring
/// so every input in the app is consistently accessible.
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

/// Convenience text input bound to the controlClass styling.
export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className, ...rest } = props;
  return <input className={cn(controlClass, className)} {...rest} />;
}
