# TruTix

TruTix is an NFT event-ticketing protocol built to take the rules that matter
in ticketing - a resale price ceiling and a creator royalty - out of a
platform's terms of service and put them where they cannot be bypassed: the
smart contract itself.

A ticket is an ERC-721 token that lives in the holder's own wallet. The resale
cap is enforced on-chain, royalties are paid automatically on every secondary
sale via ERC-2981, and entry at the venue is proven with a wallet-signed QR code
rather than a scannable barcode that can be screenshotted and forwarded. Ticket
artwork and metadata (JSON and an inline SVG) are stored entirely on-chain, so
there is no IPFS pin to lose and no gateway to go dark.

The current release runs on the **Base Sepolia** test network. It is a working
demonstration of the full flow, not an audited production service - see
[Project status](#project-status) for the honest boundaries.

## The problem it solves

Scalping works because resale happens off the books. A platform can print a
price cap in its terms, but nothing stops a bot from buying inventory in bulk
and relisting at a multiple of face value, because the cap is policy and not
code. At the same time the original creator - the artist or organizer who built
the demand - earns nothing on that secondary market, and the buyer never truly
owns the ticket: it is a revocable row in a database someone else controls.

TruTix changes the ownership model. When an organizer creates an event they set
a maximum resale percentage over face value and a royalty. From that point on:

- A resale listing above the cap does not just fail in the UI - the transaction
  reverts in the marketplace contract.
- The royalty is settled atomically on each resale and paid to the creator, with
  no invoicing and no trust required.
- The ticket is a bearer asset in the holder's wallet. No backend can revoke it.

## How it works

TruTix is a monorepo with four workspaces that share one source of truth for
contract types and ABIs.

### Smart contracts

Two Solidity contracts carry the protocol:

- **`EventTicket`** - an ERC-721 collection that handles event creation,
  minting, fully on-chain metadata, the one-way redemption flag, and ERC-2981
  royalty signalling. Each event's parameters (price, resale cap, royalty) are
  fixed at creation and immutable afterwards.
- **`TicketMarketplace`** - capped, on-chain resale settlement. It checks every
  listing against the event's cap, splits each sale between the seller and the
  royalty receiver, and uses a pull-payment pattern so funds are never pushed to
  an address that might revert.

Ownership and the redeemed flag live **only** on-chain. The off-chain database
never decides who owns a ticket or whether it has been used.

### Backend (server)

An Express + TypeScript API that does three jobs:

1. **Indexes the chain.** A background indexer mirrors contract events into
   MongoDB so the app can search and list events quickly. It persists the last
   block it processed, so after a restart or an RPC outage it resumes from that
   cursor and replays missed blocks rather than dropping them. The database is a
   read cache, never the source of truth.
2. **Authenticates organizers and staff.** Organizers sign in with Sign-In With
   Ethereum (nonce, sign, JWT) to write off-chain content. Staff receive a token
   scoped to a single event and venue.
3. **Verifies tickets at the gate.** When staff scan a holder's QR code, the
   server recovers the signer with `ecrecover`, confirms on-chain ownership and
   event scope, and only then marks the ticket redeemed on-chain. Verification is
   online-only and fails closed: if the chain is unreachable, scanning pauses
   rather than admitting an unverified ticket.

### Frontend (client)

A Vite + React + TypeScript single-page app using wagmi and viem with MetaMask.
It covers the full lifecycle: browsing events, minting a ticket to your wallet,
viewing and reselling tickets, the venue gate scanner, and an organizer console
for creating events and managing staff. Routes are gated by role - attendees
just connect a wallet, organizers authenticate with SIWE, staff use their scoped
token. On-chain actions link out to the block explorer so a user can watch a
transaction confirm instead of trusting the interface.

### Shared

A `shared` workspace holds the TypeScript types and the generated contract ABIs
that both the server and client import, so a change to a contract ripples to
both consumers from one place.

## On-chain guarantees

These hold regardless of what any user interface does:

- **Ownership is on-chain only.** The wallet holding the NFT owns the ticket.
- **Redemption is one-way.** Once a ticket is marked redeemed at the gate, it can
  never be un-redeemed.
- **The resale cap is contract-enforced** for sales settled through TruTix. A
  listing above the cap reverts. (Because the token is a standard transferable
  ERC-721, a determined holder can still move it wallet-to-wallet outside the
  marketplace; making the cap universal would require token-level transfer
  restrictions, which is future work.)
- **Metadata is self-contained.** `tokenURI` returns on-chain JSON with an inline
  SVG. As long as the chain exists, the ticket renders.
- **The protocol is non-custodial.** The backend never holds tickets or funds;
  resale settles directly between parties on-chain.

## Tech stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Monorepo  | pnpm workspaces + Turborepo                        |
| Contracts | Solidity 0.8.28 + Hardhat, on Base Sepolia         |
| Backend   | Express + TypeScript, Mongoose, viem, SIWE + JWT   |
| Frontend  | Vite + React + TypeScript, wagmi / viem (MetaMask) |
| Database  | MongoDB (off-chain cache of on-chain state)        |
| Metadata  | Fully on-chain JSON + SVG (no IPFS, no gateway)    |

## Repository layout

```
contracts/  Hardhat project - Solidity, tests, deploy and verify scripts, ABIs
server/     Express API - auth, gate verification, redemption, chain indexer
client/     React SPA - browse, mint, tickets, gate scanner, organizer console
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
cp server/.env.example     server/.env
cp client/.env.example     client/.env

pnpm dev        # runs the API and the client together
```

Common tasks fan out across the workspaces via Turborepo, with caching so an
unchanged workspace is not rebuilt or retested:

```bash
pnpm test        # contracts, server and client test suites
pnpm typecheck
pnpm lint
pnpm build
```

## Environment

**Contracts** (`contracts/.env`) - see `contracts/.env.example`:

- `RPC_URL` - Base Sepolia JSON-RPC endpoint
- `PRIVATE_KEY` - funded deployer wallet (include the `0x` prefix)
- `BASESCAN_API_KEY` - BaseScan key, used to verify contracts after deploy

**Server** (`server/.env`) - see `server/.env.example`:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - 32+ character secret for organizer and staff tokens
- `SIWE_DOMAIN` - origin used in the SIWE message (must match the client)
- `RPC_URL` - Base Sepolia JSON-RPC endpoint
- `BACKEND_PRIVATE_KEY` - redeemer wallet authorized to mark tickets redeemed
- `EVENT_TICKET_ADDR`, `MARKETPLACE_ADDR` - deployed contract addresses
- `GATE_FRESHNESS_MS` - optional QR validity window, defaults to `60000`

**Client** (`client/.env`) - see `client/.env.example`:

- `VITE_API_URL` - base URL of the API
- `VITE_SIWE_DOMAIN` - must match the server's `SIWE_DOMAIN`
- `VITE_RPC_URL` - Base Sepolia JSON-RPC endpoint
- `VITE_EVENT_TICKET_ADDR`, `VITE_MARKETPLACE_ADDR` - deployed contract addresses

## Contracts: deploy and verify

```bash
# From the contracts workspace, deploy both contracts to Base Sepolia:
pnpm --filter @trutix/contracts exec hardhat run scripts/deploy.ts --network baseSepolia

# The script prints the addresses and the exact verify commands, e.g.:
pnpm --filter @trutix/contracts exec hardhat verify --network baseSepolia <EVENT_TICKET_ADDR>
pnpm --filter @trutix/contracts exec hardhat verify --network baseSepolia <MARKETPLACE_ADDR> <EVENT_TICKET_ADDR>

# Re-export ABIs into the shared workspace after a contract change:
pnpm --filter @trutix/contracts export:abis
```

`EventTicket` takes no constructor arguments; `TicketMarketplace` takes the
`EventTicket` address.

### Deployed contracts (Base Sepolia)

| Contract            | Address                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `EventTicket`       | [`0x83b39cEbF359D676a82B373961CFbe32d478Dd77`](https://sepolia.basescan.org/address/0x83b39cEbF359D676a82B373961CFbe32d478Dd77) |
| `TicketMarketplace` | [`0x15a21D74FA71e9CaFeBcFd799E4901a30880281b`](https://sepolia.basescan.org/address/0x15a21D74FA71e9CaFeBcFd799E4901a30880281b) |

## Deployment

- **Client to Vercel.** Set the root directory to `client`, build with
  `pnpm build`, and add the `VITE_*` variables above.
- **API to Render.** Import `render.yaml` as a Blueprint and fill the secret
  variables in the dashboard. The indexer persists its last-processed block, so
  after a restart or RPC outage it resumes from that cursor. An always-on
  instance is still recommended to keep the cache close to the chain head.

## Project status

TruTix is an early-stage project on Base Sepolia (testnet only). The contracts
have **not** undergone a third-party security audit, and `EventTicket` and
`TicketMarketplace` should be treated as experimental - do not trade tickets
backed by funds you cannot afford to lose. There is no token and no on-chain
governance; per-event parameters are set by each organizer at creation. A formal
audit, production key management, and a decision on token-level transfer
restrictions to make the resale cap universal are planned ahead of any mainnet
deployment.

## License

MIT
