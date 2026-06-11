import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Full ticket lifecycle", () => {
  const EVENT_ID = 1n;
  const ROYALTY_BPS = 500n;
  const TIER_PRICE = ethers.parseEther("0.1");

  async function deploy() {
    const [organizer, alice, bob, staff] = await ethers.getSigners();
    const ticket = await (await ethers.getContractFactory("EventTicket")).deploy();
    const market = await (
      await ethers.getContractFactory("TicketMarketplace")
    ).deploy(await ticket.getAddress());
    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Launch", 100, 20, ROYALTY_BPS, startsAt, [TIER_PRICE]);
    return { ticket, market, organizer, alice, bob, staff };
  }

  it("mints, resells with royalty, redeems, then blocks reselling a used ticket", async () => {
    const { ticket, market, organizer, alice, bob, staff } = await loadFixture(deploy);

    // Alice mints a ticket.
    await ticket.connect(alice).mint(EVENT_ID, 0, { value: TIER_PRICE });
    expect(await ticket.ownerOf(1)).to.equal(alice.address);

    // Alice lists it and Bob buys it through the marketplace.
    await ticket.connect(alice).approve(await market.getAddress(), 1);
    await market.connect(alice).list(1, TIER_PRICE);
    await market.connect(bob).buy(1, { value: TIER_PRICE });
    expect(await ticket.ownerOf(1)).to.equal(bob.address);

    // Royalty went to the organizer; the remainder to Alice.
    const royalty = (TIER_PRICE * ROYALTY_BPS) / 10_000n;
    expect(await market.proceeds(organizer.address)).to.equal(royalty);
    expect(await market.proceeds(alice.address)).to.equal(TIER_PRICE - royalty);

    // Staff redeems Bob's ticket at the gate.
    await ticket.connect(organizer).grantRedeemer(EVENT_ID, staff.address);
    await ticket.connect(staff).markRedeemed(1);
    expect(await ticket.isRedeemed(1)).to.equal(true);

    // A redeemed ticket can no longer be relisted.
    await ticket.connect(bob).approve(await market.getAddress(), 1);
    await expect(market.connect(bob).list(1, TIER_PRICE)).to.be.revertedWithCustomError(
      market,
      "TicketRedeemed",
    );
  });
});
