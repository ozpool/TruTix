import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import { Scan } from "./Scan";
import { clearStaffCode, fetchStaffSession, setStaffCode } from "../lib/staffAuth";
import { submitScan } from "../lib/scan";

const MOCK_QR = JSON.stringify({ tokenId: 1, timestamp: 123, signature: "0xabc" });
const SESSION = { eventId: 5, venue: "Side Door", eventName: "Jazz Night" };

vi.mock("../components/QrScanner", () => ({
  QrScanner: ({ onResult }: { onResult: (t: string) => void }) => (
    <button onClick={() => onResult(MOCK_QR)}>fire-scan</button>
  ),
}));

vi.mock("../lib/scan", async (orig) => {
  const actual = await orig<typeof import("../lib/scan")>();
  return { ...actual, submitScan: vi.fn() };
});

vi.mock("../lib/staffAuth", async (orig) => {
  const actual = await orig<typeof import("../lib/staffAuth")>();
  return { ...actual, fetchStaffSession: vi.fn() };
});

describe("Staff scanner page", () => {
  beforeEach(() => {
    clearStaffCode();
    vi.mocked(submitScan).mockReset();
    vi.mocked(fetchStaffSession).mockReset();
  });

  it("shows the sign-in form until a valid code is entered", async () => {
    vi.mocked(fetchStaffSession).mockResolvedValue(SESSION);
    renderWithProviders(<Scan />);
    expect(screen.getByText("Staff sign-in")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("K7P2-9QXM"), {
      target: { value: "ABCD-EFGH" },
    });
    fireEvent.click(screen.getByText("Start scanning"));

    await waitFor(() => expect(screen.getByText("Gate scanner")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Jazz Night/)).toBeInTheDocument());
  });

  it("admits a ticket when the gate returns valid", async () => {
    setStaffCode("ABCD-EFGH");
    vi.mocked(fetchStaffSession).mockResolvedValue(SESSION);
    vi.mocked(submitScan).mockResolvedValue({
      state: "valid",
      owner: "0xowner",
      eventName: "Jazz Night",
      tier: 0,
      seat: 12,
    });

    renderWithProviders(<Scan />);
    fireEvent.click(screen.getByText("fire-scan"));

    await waitFor(() => expect(screen.getByText("Admitted")).toBeInTheDocument());
    expect(submitScan).toHaveBeenCalledOnce();
  });
});
