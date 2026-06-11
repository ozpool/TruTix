import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicket royalties", () => {
  const EVENT_ID = 1n;
  const ROYALTY_BPS = 500n; // 5%
  const TIER_PRICES = [ethers.parseEther("0.1")];
  const ERC2981_INTERFACE_ID = "0x2a55205a";

  async function mintedFixture() {
    const [organizer, holder] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EventTicket");
    const ticket = await factory.deploy();
    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Demo", 100, 20, ROYALTY_BPS, startsAt, TIER_PRICES);
    await ticket.connect(holder).mint(EVENT_ID, 0, { value: TIER_PRICES[0] });
    return { ticket, organizer };
  }

  it("reports the organizer and royalty amount via ERC-2981", async () => {
    const { ticket, organizer } = await loadFixture(mintedFixture);
    const salePrice = ethers.parseEther("1");

    const [receiver, amount] = await ticket.royaltyInfo(1, salePrice);
    expect(receiver).to.equal(organizer.address);
    expect(amount).to.equal((salePrice * ROYALTY_BPS) / 10_000n);
  });

  it("advertises ERC-2981 support", async () => {
    const { ticket } = await loadFixture(mintedFixture);
    expect(await ticket.supportsInterface(ERC2981_INTERFACE_ID)).to.equal(true);
  });

  it("rejects an event whose royalty exceeds 100%", async () => {
    const [organizer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EventTicket");
    const ticket = await factory.deploy();
    const startsAt = (await time.latest()) + 3600;

    await expect(
      ticket.connect(organizer).createEvent(2, "Bad", 100, 20, 10_001, startsAt, TIER_PRICES),
    ).to.be.revertedWithCustomError(ticket, "InvalidRoyalty");
  });
});
