import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to "${network.name}" with ${deployer.address}`);

  const ticket = await (await ethers.getContractFactory("EventTicket")).deploy();
  await ticket.waitForDeployment();
  const ticketAddr = await ticket.getAddress();
  console.log(`EventTicket:       ${ticketAddr}`);

  const market = await (await ethers.getContractFactory("TicketMarketplace")).deploy(ticketAddr);
  await market.waitForDeployment();
  const marketAddr = await market.getAddress();
  console.log(`TicketMarketplace: ${marketAddr}`);

  console.log("\nAdd these to your environment:");
  console.log(`EVENT_TICKET_ADDR=${ticketAddr}`);
  console.log(`MARKETPLACE_ADDR=${marketAddr}`);
  console.log("\nRefresh ABIs with: pnpm --filter @trutix/contracts export:abis");
  console.log("Verify with:");
  console.log(`  pnpm exec hardhat verify --network baseSepolia ${ticketAddr}`);
  console.log(`  pnpm exec hardhat verify --network baseSepolia ${marketAddr} ${ticketAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
