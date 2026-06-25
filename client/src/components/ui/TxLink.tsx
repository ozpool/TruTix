import { explorerTxUrl, formatTxHash } from "../../lib/format";

/// A live link to a transaction on the Base Sepolia explorer. Opens in a new
/// tab so users can watch confirmations without losing the app, and shows the
/// shortened hash as the label by default.
export function TxLink({
  hash,
  label,
  className,
}: {
  hash: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1 font-medium text-brand-300 underline-offset-2 hover:text-brand-200 hover:underline"
      }
    >
      {label ?? `Track ${formatTxHash(hash)}`}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
