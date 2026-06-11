import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { RequireOrganizer } from "./RequireOrganizer";
import { useOrganizerAuth } from "../hooks/useOrganizerAuth";

vi.mock("../hooks/useOrganizerAuth", () => ({ useOrganizerAuth: vi.fn() }));

const base = { login: vi.fn(), logout: vi.fn(), pending: false, error: null };

describe("RequireOrganizer", () => {
  it("shows the sign-in panel when no token is held", () => {
    vi.mocked(useOrganizerAuth).mockReturnValue({ ...base, token: null });
    renderWithProviders(
      <RequireOrganizer>
        <p>secret dashboard</p>
      </RequireOrganizer>,
    );
    expect(screen.getByText("Organizer sign-in")).toBeInTheDocument();
    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
  });

  it("renders children once a token is held", () => {
    vi.mocked(useOrganizerAuth).mockReturnValue({ ...base, token: "jwt" });
    renderWithProviders(
      <RequireOrganizer>
        <p>secret dashboard</p>
      </RequireOrganizer>,
    );
    expect(screen.getByText("secret dashboard")).toBeInTheDocument();
  });
});
