import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicket redemption", () => {
  const EVENT_ID = 1n;
  const TIER_PRICES = [ethers.parseEther("0.1")];

  async function mintedFixture() {
    const [organizer, holder, staff, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EventTicket");
    const ticket = await factory.deploy();
    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Demo", 100, 20, 500, startsAt, TIER_PRICES);
    await ticket.connect(holder).mint(EVENT_ID, 0, { value: TIER_PRICES[0] });
    return { ticket, organizer, holder, staff, stranger };
  }

  describe("redeemer role", () => {
    it("lets the organizer grant and revoke a redeemer", async () => {
      const { ticket, organizer, staff } = await loadFixture(mintedFixture);

      await expect(ticket.connect(organizer).grantRedeemer(EVENT_ID, staff.address))
        .to.emit(ticket, "RedeemerGranted")
        .withArgs(EVENT_ID, staff.address);
      expect(await ticket.redeemerRole(EVENT_ID, staff.address)).to.equal(true);

      await expect(ticket.connect(organizer).revokeRedeemer(EVENT_ID, staff.address))
        .to.emit(ticket, "RedeemerRevoked")
        .withArgs(EVENT_ID, staff.address);
      expect(await ticket.redeemerRole(EVENT_ID, staff.address)).to.equal(false);
    });

    it("reverts when a non-organizer grants a redeemer", async () => {
      const { ticket, stranger, staff } = await loadFixture(mintedFixture);
      await expect(
        ticket.connect(stranger).grantRedeemer(EVENT_ID, staff.address),
      ).to.be.revertedWithCustomError(ticket, "NotOrganizer");
    });
  });

  describe("markRedeemed", () => {
    it("marks a ticket redeemed exactly once", async () => {
      const { ticket, organizer, staff } = await loadFixture(mintedFixture);
      await ticket.connect(organizer).grantRedeemer(EVENT_ID, staff.address);

      expect(await ticket.isRedeemed(1)).to.equal(false);
      await expect(ticket.connect(staff).markRedeemed(1))
        .to.emit(ticket, "Redeemed")
        .withArgs(1n, EVENT_ID, staff.address);
      expect(await ticket.isRedeemed(1)).to.equal(true);

      await expect(ticket.connect(staff).markRedeemed(1)).to.be.revertedWithCustomError(
        ticket,
        "AlreadyRedeemed",
      );
    });

    it("reverts when the caller is not a redeemer", async () => {
      const { ticket, stranger } = await loadFixture(mintedFixture);
      await expect(ticket.connect(stranger).markRedeemed(1)).to.be.revertedWithCustomError(
        ticket,
        "NotRedeemer",
      );
    });

    it("reverts after the redeemer role is revoked", async () => {
      const { ticket, organizer, staff } = await loadFixture(mintedFixture);
      await ticket.connect(organizer).grantRedeemer(EVENT_ID, staff.address);
      await ticket.connect(organizer).revokeRedeemer(EVENT_ID, staff.address);

      await expect(ticket.connect(staff).markRedeemed(1)).to.be.revertedWithCustomError(
        ticket,
        "NotRedeemer",
      );
    });

    it("reverts for a token that does not exist", async () => {
      const { ticket, organizer, staff } = await loadFixture(mintedFixture);
      await ticket.connect(organizer).grantRedeemer(EVENT_ID, staff.address);

      await expect(ticket.connect(staff).markRedeemed(999)).to.be.revertedWithCustomError(
        ticket,
        "ERC721NonexistentToken",
      );
    });
  });
});
