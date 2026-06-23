import { describe, it, expect, beforeEach } from "vitest";
import { clearStaffCode, getStaffCode, setStaffCode } from "./staffAuth";

describe("staff code storage", () => {
  beforeEach(() => clearStaffCode());

  it("round-trips a code through localStorage", () => {
    expect(getStaffCode()).toBeNull();
    setStaffCode("K7P2-9QXM");
    expect(getStaffCode()).toBe("K7P2-9QXM");
    clearStaffCode();
    expect(getStaffCode()).toBeNull();
  });
});
