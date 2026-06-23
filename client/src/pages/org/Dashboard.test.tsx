import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/helpers";
import { OrgContext } from "../../org/context";
import { Dashboard } from "./Dashboard";
import { useOrgEvents } from "../../hooks/useOrgEvents";

vi.mock("../../hooks/useOrgEvents", () => ({ useOrgEvents: vi.fn() }));

describe("Organizer dashboard", () => {
  it("lists the organizer's events", () => {
    vi.mocked(useOrgEvents).mockReturnValue({
      data: [{ eventId: 7, name: "Jazz Night", capacity: 200, startsAt: "2026-07-01" }],
      isLoading: false,
    } as ReturnType<typeof useOrgEvents>);

    renderWithProviders(
      <OrgContext.Provider value={{ token: "jwt", logout: vi.fn() }}>
        <Dashboard />
      </OrgContext.Provider>,
    );

    expect(screen.getByText("Jazz Night")).toBeInTheDocument();
    expect(screen.getByText(/capacity 200/)).toBeInTheDocument();
  });
});
