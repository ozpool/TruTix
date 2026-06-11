import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicket", () => {
  const EVENT_ID = 1n;
  const CAPACITY = 100n;
  const MAX_RESALE_PCT = 20n;
  const ROYALTY_BPS = 500n;
  const TIER_PRICES = [ethers.parseEther("0.1"), ethers.parseEther("0.2")];

  async function deployFixture() {
    const [organizer, buyer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EventTicket");
    const ticket = await factory.deploy();
    const startsAt = (await time.latest()) + 3600;
    return { ticket, organizer, buyer, other, startsAt };
  }

  function createDemoEvent(
    ticket: Awaited<ReturnType<typeof deployFixture>>["ticket"],
    organizer: Awaited<ReturnType<typeof deployFixture>>["organizer"],
    startsAt: number,
  ) {
    return ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Demo", CAPACITY, MAX_RESALE_PCT, ROYALTY_BPS, startsAt, TIER_PRICES);
  }

  describe("createEvent", () => {
    it("stores the event and its tier prices", async () => {
      const { ticket, organizer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);

      const info = await ticket.events(EVENT_ID);
      expect(info.organizer).to.equal(organizer.address);
      expect(info.capacity).to.equal(CAPACITY);
      expect(await ticket.tierPrices(EVENT_ID)).to.deep.equal(TIER_PRICES);
    });

    it("reverts on a duplicate event id", async () => {
      const { ticket, organizer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);
      await expect(createDemoEvent(ticket, organizer, startsAt)).to.be.revertedWithCustomError(
        ticket,
        "EventAlreadyExists",
      );
    });

    it("reverts when no tiers are provided", async () => {
      const { ticket, organizer, startsAt } = await loadFixture(deployFixture);
      await expect(
        ticket
          .connect(organizer)
          .createEvent(EVENT_ID, "Demo", CAPACITY, MAX_RESALE_PCT, ROYALTY_BPS, startsAt, []),
      ).to.be.revertedWithCustomError(ticket, "NoTiers");
    });
  });

  describe("mint", () => {
    it("mints a ticket with tier, seat and recorded price", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);

      await expect(ticket.connect(buyer).mint(EVENT_ID, 1, { value: TIER_PRICES[1] }))
        .to.emit(ticket, "TicketMinted")
        .withArgs(1n, EVENT_ID, buyer.address, 1, 1, TIER_PRICES[1]);

      expect(await ticket.ownerOf(1)).to.equal(buyer.address);
      expect(await ticket.ticketTier(1)).to.equal(1);
      expect(await ticket.ticketSeat(1)).to.equal(1);
      expect(await ticket.mintPrice(1)).to.equal(TIER_PRICES[1]);
      expect(await ticket.eventMinted(EVENT_ID)).to.equal(1n);
    });

    it("increments the seat number per tier", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);

      await ticket.connect(buyer).mint(EVENT_ID, 0, { value: TIER_PRICES[0] });
      await ticket.connect(buyer).mint(EVENT_ID, 0, { value: TIER_PRICES[0] });
      expect(await ticket.ticketSeat(2)).to.equal(2);
    });

    it("reverts on incorrect payment", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);
      await expect(
        ticket.connect(buyer).mint(EVENT_ID, 0, { value: 1n }),
      ).to.be.revertedWithCustomError(ticket, "IncorrectPayment");
    });

    it("reverts on an invalid tier", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);
      await expect(
        ticket.connect(buyer).mint(EVENT_ID, 5, { value: TIER_PRICES[0] }),
      ).to.be.revertedWithCustomError(ticket, "InvalidTier");
    });

    it("reverts for an unknown event", async () => {
      const { ticket, buyer } = await loadFixture(deployFixture);
      await expect(
        ticket.connect(buyer).mint(99, 0, { value: TIER_PRICES[0] }),
      ).to.be.revertedWithCustomError(ticket, "EventDoesNotExist");
    });

    it("reverts once the sale has closed", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);
      await time.increaseTo(startsAt);
      await expect(
        ticket.connect(buyer).mint(EVENT_ID, 0, { value: TIER_PRICES[0] }),
      ).to.be.revertedWithCustomError(ticket, "SaleClosed");
    });

    it("reverts when capacity is reached", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await ticket
        .connect(organizer)
        .createEvent(2, "Tiny", 1, MAX_RESALE_PCT, ROYALTY_BPS, startsAt, TIER_PRICES);
      await ticket.connect(buyer).mint(2, 0, { value: TIER_PRICES[0] });
      await expect(
        ticket.connect(buyer).mint(2, 0, { value: TIER_PRICES[0] }),
      ).to.be.revertedWithCustomError(ticket, "SoldOut");
    });
  });

  describe("withdraw", () => {
    it("lets the organizer withdraw accrued proceeds", async () => {
      const { ticket, organizer, buyer, startsAt } = await loadFixture(deployFixture);
      await createDemoEvent(ticket, organizer, startsAt);
      await ticket.connect(buyer).mint(EVENT_ID, 1, { value: TIER_PRICES[1] });

      expect(await ticket.proceeds(organizer.address)).to.equal(TIER_PRICES[1]);
      await expect(ticket.connect(organizer).withdraw()).to.changeEtherBalance(
        organizer,
        TIER_PRICES[1],
      );
      expect(await ticket.proceeds(organizer.address)).to.equal(0n);
    });

    it("reverts when there is nothing to withdraw", async () => {
      const { ticket, other } = await loadFixture(deployFixture);
      await expect(ticket.connect(other).withdraw()).to.be.revertedWithCustomError(
        ticket,
        "NothingToWithdraw",
      );
    });
  });
});
