import { type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useOrganizerAuth } from "../hooks/useOrganizerAuth";
import { OrgContext } from "../org/context";

/// Gate /org routes behind a SIWE-authenticated organizer session. Shows a
/// connect-then-sign panel until a JWT is held, then provides it via context.
export function RequireOrganizer({ children }: { children: ReactNode }) {
  const { isConnected } = useAccount();
  const { token, login, logout, pending, error } = useOrganizerAuth();

  if (!token) {
    return (
      <section className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Organizer sign-in</h1>
        <p className="text-sm text-slate-400">
          Sign a message with your wallet to prove you own your events. No gas, no transaction.
        </p>
        {!isConnected ? (
          <p className="text-slate-400">Connect your wallet to continue.</p>
        ) : (
          <button
            className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold disabled:opacity-50"
            disabled={pending}
            onClick={() => void login()}
          >
            {pending ? "Check your wallet…" : "Sign in as organizer"}
          </button>
        )}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </section>
    );
  }

  return <OrgContext.Provider value={{ token, logout }}>{children}</OrgContext.Provider>;
}
