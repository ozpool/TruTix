import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Scan } from "./Scan";
import { clearStaffToken } from "../lib/staffAuth";
import { submitScan } from "../lib/scan";

const MOCK_QR = JSON.stringify({ tokenId: 1, timestamp: 123, signature: "0xabc" });

vi.mock("../components/QrScanner", () => ({
  QrScanner: ({ onResult }: { onResult: (t: string) => void }) => (
    <button onClick={() => onResult(MOCK_QR)}>fire-scan</button>
  ),
}));

vi.mock("../lib/scan", async (orig) => {
  const actual = await orig<typeof import("../lib/scan")>();
  return { ...actual, submitScan: vi.fn() };
});

function makeToken(payload: object): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${body}.sig`;
}

describe("Staff scanner page", () => {
  beforeEach(() => {
    clearStaffToken();
    vi.mocked(submitScan).mockReset();
  });

  it("shows the sign-in form until a valid token is pasted", () => {
    renderWithProviders(<Scan />);
    expect(screen.getByText("Staff sign-in")).toBeInTheDocument();

    const token = makeToken({ eventId: 5, venue: "Side Door" });
    fireEvent.change(screen.getByPlaceholderText(/eyJ/), { target: { value: token } });
    fireEvent.click(screen.getByText("Start scanning"));

    expect(screen.getByText("Gate scanner")).toBeInTheDocument();
    expect(screen.getByText(/Event 5/)).toBeInTheDocument();
  });

  it("admits a ticket when the gate returns valid", async () => {
    localStorage.setItem("trutix.staffToken", makeToken({ eventId: 5, venue: "Side Door" }));
    vi.mocked(submitScan).mockResolvedValue({ state: "valid", owner: "0xowner" });

    renderWithProviders(<Scan />);
    fireEvent.click(screen.getByText("fire-scan"));

    await waitFor(() => expect(screen.getByText("Admitted")).toBeInTheDocument());
    expect(submitScan).toHaveBeenCalledOnce();
  });
});
