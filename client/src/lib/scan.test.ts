import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseGatePayload, submitScan } from "./scan";
import { apiPost } from "./api";

vi.mock("./api", () => ({ apiPost: vi.fn() }));

describe("parseGatePayload", () => {
  it("accepts a well-formed gate payload", () => {
    const text = JSON.stringify({ tokenId: 1, timestamp: 123, signature: "0xabc" });
    expect(parseGatePayload(text)).toEqual({ tokenId: 1, timestamp: 123, signature: "0xabc" });
  });

  it("rejects non-JSON and missing or malformed fields", () => {
    expect(parseGatePayload("nope")).toBeNull();
    expect(parseGatePayload(JSON.stringify({ tokenId: 1, timestamp: 2 }))).toBeNull();
    expect(
      parseGatePayload(JSON.stringify({ tokenId: 1, timestamp: 2, signature: "zzz" })),
    ).toBeNull();
  });
});

describe("submitScan", () => {
  beforeEach(() => vi.mocked(apiPost).mockReset());

  it("posts the payload to /verify with the staff token", async () => {
    vi.mocked(apiPost).mockResolvedValue({ state: "valid", eventId: 5, owner: "0xowner" });
    const payload = { tokenId: 1, timestamp: 2, signature: "0xabc" as const };
    const result = await submitScan(payload, "tok");

    expect(apiPost).toHaveBeenCalledWith("/verify", payload, "tok");
    expect(result.state).toBe("valid");
  });
});
