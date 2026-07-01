import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const RPC_URL = process.env.RPC_URL ?? "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    baseSepolia: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
  // Etherscan V2 unified API: a single key resolves the right explorer by
  // chainId, so Base Sepolia no longer needs a custom-chain endpoint.
  etherscan: {
    apiKey: BASESCAN_API_KEY,
  },
};

export default config;
