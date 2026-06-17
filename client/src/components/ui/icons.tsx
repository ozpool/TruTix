/// Inline stroke icons (no icon-font dependency). Each is decorative by default
/// (aria-hidden); pass a title for standalone meaning.
type IconProps = { className?: string };

function svg(path: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export const TicketIcon = (p: IconProps) =>
  svg(
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
      <path d="M15 6v12" strokeDasharray="2 2" />
    </>,
    p,
  );

export const StoreIcon = (p: IconProps) =>
  svg(
    <>
      <path d="M4 9h16l-1-4H5L4 9z" />
      <path d="M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M9 19v-5h6v5" />
    </>,
    p,
  );

export const ScanIcon = (p: IconProps) =>
  svg(
    <>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M4 12h16" />
    </>,
    p,
  );

export const ShieldIcon = (p: IconProps) =>
  svg(
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>,
    p,
  );

export const PlusIcon = (p: IconProps) => svg(<path d="M12 5v14M5 12h14" />, p);

export const CheckIcon = (p: IconProps) => svg(<path d="M5 12l4 4 10-10" />, p);
