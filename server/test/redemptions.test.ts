import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { setupDb, teardownDb } from "./helpers/db";
import { createApp } from "../src/app";
import { hashStaffCode } from "../src/auth/staffCode";
import { RedemptionLog, StaffAccount } from "../src/models";

beforeAll(setupDb);
afterAll(teardownDb);

const app = createApp();

describe("GET /redemptions", () => {
  beforeEach(async () => {
    await RedemptionLog.deleteMany({});
    await StaffAccount.deleteMany({});
  });

  it("requires a staff code", async () => {
    const res = await request(app).get("/redemptions");
    expect(res.status).toBe(401);
  });

  it("returns only this staff member's own scans, newest first", async () => {
    const code = "TEST-CODE";
    const staff = await StaffAccount.create({
      eventId: 5,
      venue: "Main Gate",
      createdBy: "0xorg",
      codeHash: hashStaffCode(code),
    });
    const me = staff.id;

    await RedemptionLog.create([
      { tokenId: 1, eventId: 5, staffId: me, owner: "0xaaa", redeemedAt: new Date(1000) },
      { tokenId: 2, eventId: 5, staffId: me, owner: "0xbbb", redeemedAt: new Date(2000) },
      // same event, a different guard — must NOT appear in this staff's history
      { tokenId: 7, eventId: 5, staffId: "other", owner: "0xddd", redeemedAt: new Date(2500) },
      // different event entirely
      { tokenId: 9, eventId: 99, staffId: me, owner: "0xccc", redeemedAt: new Date(3000) },
    ]);

    const res = await request(app).get("/redemptions").set("Authorization", `Bearer ${code}`);

    expect(res.status).toBe(200);
    expect(res.body.redemptions).toHaveLength(2);
    expect(res.body.redemptions[0].tokenId).toBe(2); // newest first
    expect(res.body.redemptions[0].owner).toBe("0xbbb");
    expect(
      res.body.redemptions.every(
        (r: { eventId: number; staffId: string }) => r.eventId === 5 && r.staffId === me,
      ),
    ).toBe(true);
  });
});
