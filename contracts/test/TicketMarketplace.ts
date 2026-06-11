import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("TicketMarketplace", () => {
  const EVENT_ID = 1n;
  const ROYALTY_BPS = 500n; // 5%
  const MAX_RESALE_PCT = 20n; // +20%
  const TIER_PRICE = ethers.parseEther("0.1");

  async function listedFixture() {
    const [organizer, seller, buyer, stranger] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("EventTicket");
    const ticket = await Ticket.deploy();
    const Market = await ethers.getContractFactory("TicketMarketplace");
    const market = await Market.deploy(await ticket.getAddress());

    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Demo", 100, MAX_RESALE_PCT, ROYALTY_BPS, startsAt, [TIER_PRICE]);
    await ticket.connect(seller).mint(EVENT_ID, 0, { value: TIER_PRICE });
    await ticket.connect(seller).approve(await market.getAddress(), 1);

    return { ticket, market, organizer, seller, buyer, stranger };
  }

  describe("list", () => {
    it("lists a ticket within the cap", async () => {
      const { market, seller } = await loadFixture(listedFixture);
      await expect(market.connect(seller).list(1, TIER_PRICE))
        .to.emit(market, "Listed")
        .withArgs(1, seller.address, TIER_PRICE);

      const listing = await market.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(TIER_PRICE);
    });

    it("reverts above the resale cap", async () => {
      const { market, seller } = await loadFixture(listedFixture);
      const cap = TIER_PRICE + (TIER_PRICE * MAX_RESALE_PCT) / 100n;
      await expect(market.connect(seller).list(1, cap + 1n)).to.be.revertedWithCustomError(
        market,
        "PriceAboveCap",
      );
    });

    it("reverts when the caller does not own the ticket", async () => {
      const { market, stranger } = await loadFixture(listedFixture);
      await expect(market.connect(stranger).list(1, TIER_PRICE)).to.be.revertedWithCustomError(
        market,
        "NotOwner",
      );
    });

    it("reverts when the marketplace is not approved", async () => {
      const { ticket, market, buyer } = await loadFixture(listedFixture);
      await ticket.connect(buyer).mint(EVENT_ID, 0, { value: TIER_PRICE });
      await expect(market.connect(buyer).list(2, TIER_PRICE)).to.be.revertedWithCustomError(
        market,
        "NotApproved",
      );
    });

    it("reverts when the ticket is already redeemed", async () => {
      const { ticket, market, organizer, seller } = await loadFixture(listedFixture);
      await ticket.connect(organizer).grantRedeemer(EVENT_ID, organizer.address);
      await ticket.connect(organizer).markRedeemed(1);
      await expect(market.connect(seller).list(1, TIER_PRICE)).to.be.revertedWithCustomError(
        market,
        "TicketRedeemed",
      );
    });
  });

  describe("buy", () => {
    it("transfers the NFT and splits proceeds and royalty", async () => {
      const { ticket, market, organizer, seller, buyer } = await loadFixture(listedFixture);
      await market.connect(seller).list(1, TIER_PRICE);

      await expect(market.connect(buyer).buy(1, { value: TIER_PRICE }))
        .to.emit(market, "Sold")
        .withArgs(1, seller.address, buyer.address, TIER_PRICE);

      expect(await ticket.ownerOf(1)).to.equal(buyer.address);
      const royalty = (TIER_PRICE * ROYALTY_BPS) / 10_000n;
      expect(await market.proceeds(organizer.address)).to.equal(royalty);
      expect(await market.proceeds(seller.address)).to.equal(TIER_PRICE - royalty);
    });

    it("lets the seller and organizer withdraw their balances", async () => {
      const { market, organizer, seller, buyer } = await loadFixture(listedFixture);
      await market.connect(seller).list(1, TIER_PRICE);
      await market.connect(buyer).buy(1, { value: TIER_PRICE });

      const royalty = (TIER_PRICE * ROYALTY_BPS) / 10_000n;
      await expect(market.connect(seller).withdraw()).to.changeEtherBalance(
        seller,
        TIER_PRICE - royalty,
      );
      await expect(market.connect(organizer).withdraw()).to.changeEtherBalance(organizer, royalty);
    });

    it("reverts on incorrect payment", async () => {
      const { market, seller, buyer } = await loadFixture(listedFixture);
      await market.connect(seller).list(1, TIER_PRICE);
      await expect(market.connect(buyer).buy(1, { value: 1n })).to.be.revertedWithCustomError(
        market,
        "IncorrectPayment",
      );
    });

    it("reverts when the ticket is not listed", async () => {
      const { market, buyer } = await loadFixture(listedFixture);
      await expect(
        market.connect(buyer).buy(1, { value: TIER_PRICE }),
      ).to.be.revertedWithCustomError(market, "NotListed");
    });
  });

  describe("cancel", () => {
    it("lets the seller cancel a listing", async () => {
      const { market, seller } = await loadFixture(listedFixture);
      await market.connect(seller).list(1, TIER_PRICE);
      await expect(market.connect(seller).cancel(1))
        .to.emit(market, "Cancelled")
        .withArgs(1, seller.address);
      expect((await market.listings(1)).seller).to.equal(ethers.ZeroAddress);
    });

    it("reverts when a non-seller cancels", async () => {
      const { market, seller, stranger } = await loadFixture(listedFixture);
      await market.connect(seller).list(1, TIER_PRICE);
      await expect(market.connect(stranger).cancel(1)).to.be.revertedWithCustomError(
        market,
        "NotOwner",
      );
    });
  });
});
