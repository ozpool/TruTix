import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchStaffSession, getStaffCode, type StaffSession } from "../lib/staffAuth";
import { useRedemptions } from "../hooks/useRedemptions";
import { ScanLog } from "../components/ScanLog";
import { EmptyState } from "../components/ui/EmptyState";
import { ButtonLink } from "../components/ui/Button";
import { ScanIcon } from "../components/ui/icons";

/// The full redemption history for the signed-in staff member's event. Reuses
/// the same staff code the scanner stores, so it works on its own tab.
export function RedemptionLog() {
  const code = getStaffCode();
  const { data: history } = useRedemptions(code);
  const session = useQuery<StaffSession>({
    queryKey: ["staff-session", code],
    queryFn: () => fetchStaffSession(code as string),
    enabled: Boolean(code),
    retry: false,
  });

  if (!code) {
    return (
      <EmptyState
        icon={<ScanIcon className="h-8 w-8" />}
        title="Sign in to view the log"
        hint="The redemption log is scoped to a staff code."
        action={<ButtonLink to="/scan">Go to scanner</ButtonLink>}
      />
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Redemption log</h1>
        <p className="text-sm text-slate-400">
          {session.data
            ? `${session.data.eventName || "Event"} · ${session.data.venue}`
            : "Loading…"}{" "}
          ·{" "}
          <Link to="/scan" className="font-medium text-brand-300 hover:text-brand-200">
            back to scanner
          </Link>
        </p>
      </header>
      <ScanLog redemptions={history} />
    </section>
  );
}
