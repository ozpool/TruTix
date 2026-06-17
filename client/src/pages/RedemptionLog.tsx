import { Link } from "react-router-dom";
import { getStaffToken, decodeStaffClaims } from "../lib/staffAuth";
import { useRedemptions } from "../hooks/useRedemptions";
import { ScanLog } from "../components/ScanLog";
import { EmptyState } from "../components/ui/EmptyState";
import { ButtonLink } from "../components/ui/Button";
import { ScanIcon } from "../components/ui/icons";

/// The full redemption history for the signed-in staff member's event. Reuses
/// the same staff token the scanner stores, so it works on its own tab.
export function RedemptionLog() {
  const token = getStaffToken();
  const claims = token ? decodeStaffClaims(token) : null;
  const { data: history } = useRedemptions(token);

  if (!token || !claims) {
    return (
      <EmptyState
        icon={<ScanIcon className="h-8 w-8" />}
        title="Sign in to view the log"
        hint="The redemption log is scoped to a staff token."
        action={<ButtonLink to="/scan">Go to scanner</ButtonLink>}
      />
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Redemption log</h1>
        <p className="text-sm text-slate-400">
          Event {claims.eventId} · {claims.venue} ·{" "}
          <Link to="/scan" className="font-medium text-brand-300 hover:text-brand-200">
            back to scanner
          </Link>
        </p>
      </header>
      <ScanLog redemptions={history} />
    </section>
  );
}
