# TruTix

NFT event tickets with on-chain anti-scalping. Tickets are ERC-721 tokens on
**Base Sepolia**; resale prices are capped by the smart contract, royalties are
enforced via ERC-2981, and entry is verified at the gate with a wallet-signed QR
code. Ticket metadata (JSON + SVG) lives entirely on-chain — no IPFS, no external
gateways.

## Why it exists

Scalping works because resale happens off the books. TruTix moves the rules
on-chain: an organizer sets a maximum resale percentage when they create an
event, and the marketplace contract rejects any listing above the cap. The cap
is a guarantee, not a suggestion — the UI mirrors it, but the contract enforces
it.

## Features

- **Capped resale** — listings above the organizer's cap revert on-chain.
- **Royalty enforcement** — each resale splits proceeds to the organizer via
  ERC-2981, settled on-chain with a pull-payment pattern.
- **Fully on-chain metadata** — `tokenURI` returns self-contained JSON and an
  inline SVG; nothing depends on an external host.
- **Cryptographic gate entry** — the holder signs a short-lived message; staff
  scan the QR and the backend verifies the signature with `ecrecover`, checks
  ownership and event scope, then marks the ticket redeemed on-chain (one-way).
- **Live UI** — balances, listings and redemptions update in step with the
  chain, no manual refresh.
- **Role-scoped access** — attendees connect a wallet; organizers authenticate
  with Sign-In With Ethereum (SIWE); staff receive an event- and venue-scoped
  token for the gate.

## Tech stack

| Layer     | Choice                                           |
| --------- | ------------------------------------------------ |
| Monorepo  | pnpm workspaces + Turborepo                      |
| Contracts | Solidity + Hardhat (Base Sepolia)                |
| Backend   | Express + TypeScript, Mongoose, viem, SIWE + JWT |
| Frontend  | Vite + React + TypeScript, wagmi/viem (MetaMask) |
| Database  | MongoDB (off-chain cache of on-chain state)      |

Ownership and the redeemed flag are **on-chain only**; MongoDB is a read cache
populated by an event indexer and is never the source of truth.

## Repository layout

```
contracts/  Hardhat project — Solidity, tests, deploy scripts, exported ABIs
server/     Express API — auth, gate verification, redemption, chain indexer
client/     React SPA — browse, mint, tickets, gate scanner, organizer console
shared/     Shared TypeScript types and generated contract ABIs
```

## Prerequisites

- Node.js 20+
- pnpm 9 (`corepack enable`)
- A MongoDB instance (local or MongoDB Atlas)
- A Base Sepolia RPC endpoint and a funded test wallet

## Local development

```bash
pnpm install

# Configure each workspace from its template:
cp contracts/.env.example contracts/.env
cp server/.env.example   server/.env
cp client/.env.example   client/.env

pnpm dev        # runs the API and the client together
```

Common tasks fan out across workspaces via Turborepo:

```bash
pnpm test        # contracts, server and client test suites
pnpm typecheck
pnpm lint
pnpm build
```

## Environment

**Server** (`server/.env`) — see `server/.env.example`:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — ≥32-char secret for organizer/staff tokens
- `SIWE_DOMAIN` — origin used in the SIWE message (must match the client)
- `RPC_URL` — Base Sepolia JSON-RPC endpoint
- `BACKEND_PRIVATE_KEY` — redeemer wallet authorized to mark tickets redeemed
- `EVENT_TICKET_ADDR`, `MARKETPLACE_ADDR` — deployed contract addresses
- `GATE_FRESHNESS_MS` — optional; QR validity window, defaults to `60000`

**Client** (`client/.env`) — see `client/.env.example`:

- `VITE_API_URL` — base URL of the API
- `VITE_SIWE_DOMAIN` — must match the server's `SIWE_DOMAIN`
- `VITE_RPC_URL` — Base Sepolia JSON-RPC endpoint
- `VITE_EVENT_TICKET_ADDR`, `VITE_MARKETPLACE_ADDR` — deployed contract addresses

## Deployment

- **Client → Vercel.** Set the root directory to `client`, build with
  `pnpm build`, and add the `VITE_*` variables above.
- **API → Render.** Import `render.yaml` as a Blueprint and fill the secret
  variables in the dashboard. The chain indexer persists its last-processed
  block, so after a restart or RPC outage it resumes from that cursor and
  replays the blocks it missed rather than dropping them. An always-on instance
  is still recommended to keep the cache close to the chain head.

## License

MIT
