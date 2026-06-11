import { createContext, useContext } from "react";

export interface OrgSession {
  token: string;
  logout: () => void;
}

export const OrgContext = createContext<OrgSession | null>(null);

/// Read the authenticated organizer session. Only valid inside RequireOrganizer.
export function useOrg(): OrgSession {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within RequireOrganizer");
  return ctx;
}
