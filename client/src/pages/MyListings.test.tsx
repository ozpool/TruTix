import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { MyListings } from "./MyListings";
import { useResale } from "../hooks/useResale";
import { useTickets } from "../hooks/useTickets";
import { useListTicket } from "../hooks/useListTicket";

vi.mock("../hooks/useResale", () => ({ useResale: vi.fn() }));
vi.mock("../hooks/useTickets", () => ({ useTickets: vi.fn() }));
vi.mock("../hooks/useListTicket", () => ({ useListTicket: vi.fn() }));

const start = vi.fn();

describe("My resale listings page", () => {
  beforeEach(() => {
    start.mockReset();
    vi.mocked(useResale).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useResale>);
    vi.mocked(useTickets).mockReturnValue({
      data: [{ tokenId: 9, eventId: 7, owner: "0xabc", tier: 0, seat: 1 }],
    } as ReturnType<typeof useTickets>);
    vi.mocked(useListTicket).mockReturnValue({
      phase: "idle",
      error: null,
      hash: undefined,
      start,
    });
  });

  it("starts a listing for the chosen ticket and price", () => {
    renderWithProviders(<MyListings />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "9" } });
    fireEvent.change(screen.getByPlaceholderText("Price ETH"), { target: { value: "0.1" } });
    fireEvent.click(screen.getByText("List for sale"));

    expect(start).toHaveBeenCalledWith(9, "0.1");
  });
});
