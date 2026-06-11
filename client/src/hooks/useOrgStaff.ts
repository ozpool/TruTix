import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useOrg } from "../org/context";

export interface StaffMember {
  _id: string;
  eventId: number;
  venue: string;
  label: string;
}

/// Staff accounts created by the signed-in organizer (GET /org/staff).
/// Signs the organizer out if the token has expired (401).
export function useOrgStaff(token: string) {
  const { logout } = useOrg();
  const query = useQuery({
    queryKey: ["org-staff", token],
    queryFn: () => apiGet<{ staff: StaffMember[] }>("/org/staff", token).then((r) => r.staff),
    enabled: Boolean(token),
    retry: false,
  });
  useEffect(() => {
    if (query.error && String(query.error).includes("401")) logout();
  }, [query.error, logout]);
  return query;
}
