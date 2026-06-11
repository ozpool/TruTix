import { describe, it, expect, beforeEach } from "vitest";
import { clearStaffToken, decodeStaffClaims, getStaffToken, setStaffToken } from "./staffAuth";

function makeToken(payload: object): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${body}.sig`;
}

describe("staff token storage", () => {
  beforeEach(() => clearStaffToken());

  it("round-trips a token through localStorage", () => {
    expect(getStaffToken()).toBeNull();
    setStaffToken("abc");
    expect(getStaffToken()).toBe("abc");
    clearStaffToken();
    expect(getStaffToken()).toBeNull();
  });
});

describe("decodeStaffClaims", () => {
  it("reads eventId and venue from a well-formed token", () => {
    const token = makeToken({ sub: "s1", role: "staff", eventId: 5, venue: "Side Door" });
    expect(decodeStaffClaims(token)).toEqual({ eventId: 5, venue: "Side Door" });
  });

  it("returns null for a malformed token", () => {
    expect(decodeStaffClaims("not-a-jwt")).toBeNull();
    expect(decodeStaffClaims(makeToken({ role: "staff" }))).toBeNull();
  });
});
