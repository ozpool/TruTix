import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicket metadata", () => {
  const EVENT_ID = 1n;
  const TIER_PRICES = [ethers.parseEther("0.1"), ethers.parseEther("0.2")];

  async function mintedFixture() {
    const [organizer, holder] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EventTicket");
    const ticket = await factory.deploy();
    const startsAt = (await time.latest()) + 3600;
    await ticket
      .connect(organizer)
      .createEvent(EVENT_ID, "Demo Night", 100, 20, 500, startsAt, TIER_PRICES);
    await ticket.connect(holder).mint(EVENT_ID, 1, { value: TIER_PRICES[1] });
    return { ticket };
  }

  function decodeDataUri(uri: string, prefix: string): string {
    expect(uri.startsWith(prefix)).to.equal(true);
    return Buffer.from(uri.slice(prefix.length), "base64").toString("utf8");
  }

  it("returns fully on-chain base64 JSON metadata", async () => {
    const { ticket } = await loadFixture(mintedFixture);
    const json = JSON.parse(
      decodeDataUri(await ticket.tokenURI(1), "data:application/json;base64,"),
    );

    expect(json.name).to.contain("Demo Night");
    const attr = (t: string) =>
      json.attributes.find((a: { trait_type: string; value: unknown }) => a.trait_type === t)
        ?.value;
    expect(attr("Tier")).to.equal(1);
    expect(attr("Seat")).to.equal(1);
    expect(attr("Redeemed")).to.equal(false);
  });

  it("embeds an inline SVG image with the event details", async () => {
    const { ticket } = await loadFixture(mintedFixture);
    const json = JSON.parse(
      decodeDataUri(await ticket.tokenURI(1), "data:application/json;base64,"),
    );
    const svg = decodeDataUri(json.image, "data:image/svg+xml;base64,");

    expect(svg).to.contain("<svg");
    expect(svg).to.contain("Demo Night");
    expect(svg).to.contain("Seat 1");
  });

  it("reverts for a token that does not exist", async () => {
    const { ticket } = await loadFixture(mintedFixture);
    await expect(ticket.tokenURI(999)).to.be.revertedWithCustomError(
      ticket,
      "ERC721NonexistentToken",
    );
  });
});
