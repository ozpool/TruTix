import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Marketplace reentrancy", () => {
  const EVENT_ID = 1n;
  const TIER_PRICE = ethers.parseEther("0.1");

  async function listedFixture() {
    const [organizer, seller] = await ethers.getSigners();
    const ticket = await (await ethers.getContractFactory("EventTicket")).deploy();
    const market = await (
      await ethers.getContractFactory("TicketMarketplace")
    ).deploy(await ticket.getAddress());
    const attacker = await (
      await ethers.getContractFactory("ReentrantBuyer")
    ).deploy(await market.getAddress());

    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Launch", 100, 20, 500, startsAt, [TIER_PRICE]);
    await ticket.connect(seller).mint(EVENT_ID, 0, { value: TIER_PRICE });
    await ticket.connect(seller).approve(await market.getAddress(), 1);
    await market.connect(seller).list(1, TIER_PRICE);

    return { market, attacker, seller };
  }

  it("blocks a reentrant buy from the ERC-721 receiver hook", async () => {
    const { attacker } = await loadFixture(listedFixture);
    await expect(attacker.attack(1, { value: TIER_PRICE })).to.be.reverted;
  });

  it("leaves the listing intact after a failed attack", async () => {
    const { market, attacker } = await loadFixture(listedFixture);
    await expect(attacker.attack(1, { value: TIER_PRICE })).to.be.reverted;
    expect((await market.listings(1)).price).to.equal(TIER_PRICE);
  });
});
