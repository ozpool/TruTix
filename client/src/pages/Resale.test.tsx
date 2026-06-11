import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Resale } from "./Resale";
import { useResale } from "../hooks/useResale";

vi.mock("../hooks/useResale", () => ({ useResale: vi.fn() }));

describe("Resale marketplace page", () => {
  it("renders active listings with their price", () => {
    vi.mocked(useResale).mockReturnValue({
      data: [{ tokenId: 3, eventId: 7, price: "50000000000000000", seller: "0xabc" }],
      isLoading: false,
    } as ReturnType<typeof useResale>);

    renderWithProviders(<Resale />);

    expect(screen.getByText("Ticket #3")).toBeInTheDocument();
    expect(screen.getByText(/0\.05 ETH/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no listings", () => {
    vi.mocked(useResale).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useResale>);

    renderWithProviders(<Resale />);
    expect(screen.getByText("No active listings.")).toBeInTheDocument();
  });
});
