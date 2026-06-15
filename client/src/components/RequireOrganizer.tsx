import { type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useOrganizerAuth } from "../hooks/useOrganizerAuth";
import { OrgContext } from "../org/context";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ShieldIcon } from "./ui/icons";

/// Gate /org routes behind a SIWE-authenticated organizer session. Shows a
/// connect-then-sign panel until a JWT is held, then provides it via context.
export function RequireOrganizer({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const { token, login, logout, pending, error } = useOrganizerAuth();

  if (!token) {
    return (
      <Card className="mx-auto max-w-md space-y-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
          <ShieldIcon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Organizer sign-in</h1>
        <p className="text-sm text-slate-400">
          Sign a message with your wallet to prove you own your events. No gas, no transaction.
        </p>
        {!isConnected ? (
          <p className="text-sm text-slate-400">Connect your wallet to continue.</p>
        ) : (
          <Button loading={pending} onClick={() => void login()}>
            {pending ? "Check your wallet…" : "Sign in as organizer"}
          </Button>
        )}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </Card>
    );
  }

  return <OrgContext.Provider value={{ token, logout }}>{children}</OrgContext.Provider>;
}
