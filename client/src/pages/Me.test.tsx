import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Me } from "./Me";

vi.mock("wagmi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("wagmi")>();
  return { ...actual, useAccount: () => ({ address: "0xabc" }) };
});

vi.mock("../hooks/useMyTickets", () => ({
  useMyTickets: () => ({
    tickets: [{ tokenId: 1, eventId: 7, owner: "0xabc", tier: 0, seat: 1 }],
    isLoading: false,
    isError: false,
    staleFromCache: false,
    refetch: () => {},
  }),
}));

vi.mock("../hooks/useEvents", () => ({
  useEventMap: () => ({
    get: () => undefined,
    name: (id: number) => (id === 7 ? "Summer Fest" : `Event #${id}`),
  }),
}));

describe("My Tickets page", () => {
  it("renders the wallet's tickets with the event name and a count", () => {
    renderWithProviders(<Me />);
    expect(screen.getByText("Ticket #1")).toBeInTheDocument();
    expect(screen.getByText("Summer Fest")).toBeInTheDocument();
    expect(screen.getByText(/1 ticket ·/)).toBeInTheDocument();
  });
});
