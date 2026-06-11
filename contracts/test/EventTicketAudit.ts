import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicket input validation", () => {
  const TIER_PRICES = [ethers.parseEther("0.1")];

  async function deploy() {
    const [organizer] = await ethers.getSigners();
    const ticket = await (await ethers.getContractFactory("EventTicket")).deploy();
    const startsAt = (await time.latest()) + 3600;
    return { ticket, organizer, startsAt };
  }

  it("rejects an event with zero capacity", async () => {
    const { ticket, organizer, startsAt } = await loadFixture(deploy);
    await expect(
      ticket.connect(organizer).createEvent(1, "Demo", 0, 20, 500, startsAt, TIER_PRICES),
    ).to.be.revertedWithCustomError(ticket, "ZeroCapacity");
  });

  it("rejects an event whose start time is in the past", async () => {
    const { ticket, organizer } = await loadFixture(deploy);
    const past = (await time.latest()) - 1;
    await expect(
      ticket.connect(organizer).createEvent(1, "Demo", 100, 20, 500, past, TIER_PRICES),
    ).to.be.revertedWithCustomError(ticket, "StartInPast");
  });
});
