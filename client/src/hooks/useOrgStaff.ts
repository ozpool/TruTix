import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";

export interface StaffMember {
  _id: string;
  eventId: number;
  venue: string;
  label: string;
}

/// Staff accounts created by the signed-in organizer (GET /org/staff).
export function useOrgStaff(token: string) {
  return useQuery({
    queryKey: ["org-staff", token],
    queryFn: () => apiGet<{ staff: StaffMember[] }>("/org/staff", token).then((r) => r.staff),
    enabled: Boolean(token),
  });
}
