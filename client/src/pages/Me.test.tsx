import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Me } from "./Me";

vi.mock("../hooks/useTickets", () => ({
  useTickets: () => ({
    data: [{ tokenId: 1, eventId: 7, owner: "0xabc", tier: 0, seat: 1 }],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("../hooks/useEvents", () => ({
  useEventMap: () => ({
    get: () => undefined,
    name: (id: number) => (id === 7 ? "Summer Fest" : `Event #${id}`),
  }),
}));

describe("My Tickets page", () => {
  it("renders the wallet's tickets with the event name", () => {
    renderWithProviders(<Me />);
    expect(screen.getByText("Ticket #1")).toBeInTheDocument();
    expect(screen.getByText("Summer Fest")).toBeInTheDocument();
  });
});
