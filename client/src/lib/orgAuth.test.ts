import { describe, it, expect, beforeEach } from "vitest";
import { clearOrgToken, decodeOrgAddress, getOrgToken, setOrgToken } from "./orgAuth";

function makeToken(payload: object): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_");
  return `header.${body}.sig`;
}

describe("organizer token storage", () => {
  beforeEach(() => clearOrgToken());

  it("round-trips a token through localStorage", () => {
    expect(getOrgToken()).toBeNull();
    setOrgToken("jwt");
    expect(getOrgToken()).toBe("jwt");
    clearOrgToken();
    expect(getOrgToken()).toBeNull();
  });
});

describe("decodeOrgAddress", () => {
  it("reads the subject address from the token", () => {
    expect(decodeOrgAddress(makeToken({ sub: "0xabc", role: "organizer" }))).toBe("0xabc");
  });

  it("returns null for a malformed token", () => {
    expect(decodeOrgAddress("nope")).toBeNull();
  });
});
