import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/helpers";
import { OrgContext } from "../../org/context";
import { Staff } from "./Staff";
import { useOrgEvents } from "../../hooks/useOrgEvents";
import { useOrgStaff } from "../../hooks/useOrgStaff";
import { apiPost } from "../../lib/api";

vi.mock("../../hooks/useOrgEvents", () => ({ useOrgEvents: vi.fn() }));
vi.mock("../../hooks/useOrgStaff", () => ({ useOrgStaff: vi.fn() }));
vi.mock("../../lib/api", () => ({ apiPost: vi.fn() }));

describe("Staff management page", () => {
  beforeEach(() => {
    vi.mocked(useOrgEvents).mockReturnValue({
      data: [{ eventId: 7, name: "Jazz Night", capacity: 200, startsAt: "" }],
    } as ReturnType<typeof useOrgEvents>);
    vi.mocked(useOrgStaff).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useOrgStaff>);
    vi.mocked(apiPost).mockReset();
  });

  it("issues a code after creating staff", async () => {
    vi.mocked(apiPost).mockResolvedValue({ code: "K7P2-9QXM" });
    renderWithProviders(
      <OrgContext.Provider value={{ token: "jwt", logout: vi.fn() }}>
        <Staff />
      </OrgContext.Provider>,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "7" } });
    fireEvent.change(screen.getByPlaceholderText("Venue / gate name"), {
      target: { value: "Main Gate" },
    });
    fireEvent.click(screen.getByText("Create staff code"));

    await waitFor(() => expect(screen.getByText("K7P2-9QXM")).toBeInTheDocument());
    expect(apiPost).toHaveBeenCalledWith(
      "/org/staff",
      { eventId: 7, venue: "Main Gate", label: "" },
      "jwt",
    );
  });
});
