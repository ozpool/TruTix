import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ButtonLink } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ShieldIcon, TicketIcon, StoreIcon, ScanIcon } from "../components/ui/icons";
import { cn } from "../lib/cn";
import { eventTicket, marketplace } from "../contracts";
import { explorerAddressUrl, formatAddress } from "../lib/format";

/// The two protocol contracts as deployed on Base Sepolia. Addresses come from
/// the same env the app uses, so the paper never drifts from the running build.
const deployedContracts = [
  ["EventTicket", eventTicket.address],
  ["TicketMarketplace", marketplace.address],
] as const;

/// Each section is anchored so the table of contents can jump to it.
interface Section {
  id: string;
  num: string;
  title: string;
  content: ReactNode;
}

const sections: Section[] = [
  {
    id: "executive-summary",
    num: "01",
    title: "Executive Summary",
    content: (
      <div className="space-y-4">
        <p>
          The live-event industry loses billions every year to scalping, counterfeit tickets, and
          opaque resale markets where neither fans nor creators are protected. On traditional
          platforms, the ticket, the identity, and the money are all custodied by the platform -
          fans rent access they can lose at any moment, and price caps exist only as unenforceable
          policy.
        </p>
        <p>
          TruTix reframes a ticket as an asset the holder genuinely owns: an NFT in their own
          wallet. The rules that matter - a maximum resale price and a creator royalty - are
          enforced by the smart contract itself, not by a user interface that can be bypassed.
          Tickets are fully self-contained on-chain (JSON + SVG, no external gateway), and entry is
          verified by a wallet-signed QR code checked with <code>ecrecover</code> at the gate. The
          backend never custodies tickets or funds.
        </p>
        <p className="text-slate-400">
          This paper describes the problem, the protocol, its security model, and the boundaries of
          the current release - which is a testnet, pre-audit demonstration, not a production
          service.
        </p>
      </div>
    ),
  },
  {
    id: "introduction",
    num: "02",
    title: "Introduction",
    content: (
      <div className="space-y-4">
        <p>
          A ticket should be a bearer asset - something you hold and control. Today it is usually a
          revocable row in a database you do not own, governed by terms that can change without your
          consent. That gap is the source of most ticketing pain: lock-in, silent duplication, and
          secondary markets that extract value from everyone except the fan and the creator.
        </p>
        <p>
          Web3 primitives map cleanly onto this problem. Verifiable ownership replaces trust in a
          platform. A price cap enforced in marketplace code becomes a rule rather than a policy.
          Atomic settlement lets royalties pay out the instant a ticket changes hands. TruTix
          assembles these primitives into a single, coherent ticketing protocol.
        </p>
        <p className="text-slate-400">
          <strong className="text-slate-300">Scope.</strong> This is a minimum-viable release on the
          Base Sepolia test network. We are deliberate about what is in scope and what is future
          work; see the Appendix for the full exclusion list.
        </p>
      </div>
    ),
  },
  {
    id: "problem",
    num: "03",
    title: "The Problem",
    content: (
      <ul className="space-y-3">
        {[
          [
            "Scalping & price gouging",
            "Bots buy inventory in bulk and relist at multiples of face value. Caps printed in terms of service are unenforceable at the point of sale.",
          ],
          [
            "Counterfeits & duplicates",
            "Screenshots, forwarded PDFs, and duplicated barcodes let the same seat be sold twice - the fan finds out at the door.",
          ],
          [
            "Platform lock-in & revocation",
            "The platform holds the ticket. Accounts can be suspended and access revoked, leaving the fan with nothing they actually own.",
          ],
          [
            "Creators earn nothing on resale",
            "Once a ticket is sold, every cent of the secondary market flows to scalpers, not the artist or organizer who created the demand.",
          ],
        ].map(([h, b]) => (
          <li key={h} className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
            <p className="font-medium text-slate-100">{h}</p>
            <p className="mt-1 text-sm text-slate-400">{b}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "market",
    num: "04",
    title: "Market & Competitive Landscape",
    content: (
      <div className="space-y-4">
        <p>
          Online event ticketing is a large, growing market - published estimates for 2025 range
          from roughly US$53&nbsp;billion to US$85&nbsp;billion depending on scope and methodology,
          with strong forecast growth through the decade. A meaningful share of that value moves
          through the secondary (resale) market, much of it captured by scalpers rather than fans or
          creators.
        </p>
        <p>
          Incumbents such as Ticketmaster and SeatGeek dominate primary sales but treat resale as
          either unregulated or capped only through contractual terms - policy, not code. Web3
          efforts have explored on-chain ownership: GET Protocol, for example, has powered millions
          of NFT tickets and gives organizers resale control, but abstracts the NFT and custody away
          from the end user.
        </p>
        <p className="text-slate-400">
          TruTix&rsquo;s distinct position is the combination of{" "}
          <strong>self-custodied tickets</strong> (the NFT lives in the fan&rsquo;s own wallet), a
          resale cap enforced in an <strong>open marketplace contract</strong>, and{" "}
          <strong>fully on-chain, gateway-free metadata</strong>. We are early and unproven at scale
          - this is a stated position, not a claim of market leadership.
        </p>
      </div>
    ),
  },
  {
    id: "solution",
    num: "05",
    title: "The TruTix Solution",
    content: (
      <div className="space-y-4">
        <p>
          TruTix is built around a small set of invariants that hold on-chain regardless of what any
          interface does:
        </p>
        <ul className="space-y-2">
          {[
            [
              "Ownership is on-chain only",
              "The wallet that holds the NFT owns the ticket. No off-chain record can override it.",
            ],
            [
              "Redemption is one-way",
              "Once a ticket is marked redeemed at the gate, it can never be un-redeemed. There is no path back.",
            ],
            [
              "The resale cap is contract-enforced on the TruTix marketplace",
              "A sale through TruTix above the organizer's cap reverts. (Direct wallet-to-wallet transfers can bypass it - see Edge Cases.)",
            ],
          ].map(([h, b]) => (
            <li key={h} className="flex gap-3">
              <span aria-hidden className="mt-1 text-brand-400">
                ▹
              </span>
              <span>
                <strong className="text-slate-100">{h}.</strong>{" "}
                <span className="text-slate-400">{b}</span>
              </span>
            </li>
          ))}
        </ul>
        <p>
          Two contracts carry the protocol: <strong>EventTicket</strong> (minting, metadata,
          redemption, royalties) and <strong>TicketMarketplace</strong> (capped, on-chain resale
          settlement). An off-chain indexer mirrors chain events into a database used purely as a
          read cache for search and display - it never decides ownership or redemption.
        </p>
      </div>
    ),
  },
  {
    id: "anti-scalping",
    num: "06",
    title: "On-Chain Anti-Scalping",
    content: (
      <div className="space-y-4">
        <p>
          When an organizer creates an event they set a maximum resale price as a percentage over
          face value. The marketplace contract checks every listing against that cap. A listing
          above it does not merely fail in the app - the transaction <strong>reverts</strong>.
        </p>
        <p className="text-slate-400">
          The interface still validates the price for a smooth experience, but the UI check is UX;
          the on-chain revert is the guarantee - <strong>for sales settled through TruTix</strong>.
          Because the ticket is a standard transferable NFT, a determined holder can still move it
          wallet-to-wallet or list it on a generic marketplace outside the cap. We treat this
          limitation as a first-class honesty point, covered in Edge Cases &amp; Failure Modes.
        </p>
      </div>
    ),
  },
  {
    id: "royalties",
    num: "07",
    title: "Enforced Royalties (ERC-2981)",
    content: (
      <p>
        Each event encodes a creator royalty using the ERC-2981 standard. On every resale, the
        royalty is settled atomically at the moment of sale and paid directly to the creator -
        forever, with no invoicing and no trust required. The creator earns from a healthy secondary
        market instead of being cut out of it.
      </p>
    ),
  },
  {
    id: "metadata",
    num: "08",
    title: "Fully On-Chain Metadata",
    content: (
      <p>
        A ticket&rsquo;s <code>tokenURI</code> returns a self-contained JSON document with an
        embedded SVG image. There is no IPFS hash, no external gateway, and no link to rot. As long
        as the chain exists, the ticket renders - its art and attributes are part of the asset
        itself, not a pointer to a file that might disappear.
      </p>
    ),
  },
  {
    id: "gate-identity",
    num: "09",
    title: "Cryptographic Gate Identity",
    content: (
      <div className="space-y-4">
        <p>
          At the venue, the holder shows a QR code signed by their wallet. The signature is
          refreshed on a timer so a screenshot expires quickly. Staff scan it, and the server
          verifies the signature with <code>ecrecover</code> to confirm the scanner is the true
          owner before marking the ticket redeemed on-chain.
        </p>
        <p className="text-slate-400">
          Verification is online-only and <strong>fails closed</strong>: if the chain is
          unreachable, scanning pauses rather than admitting an unverified ticket. A ticket is never
          marked redeemed off-chain unless the on-chain transaction succeeds.
        </p>
      </div>
    ),
  },
  {
    id: "edge-cases",
    num: "10",
    title: "Edge Cases & Failure Modes",
    content: (
      <div className="space-y-4">
        <p>True on-chain ownership has hard edges. We state them plainly rather than hide them.</p>
        <ul className="space-y-3">
          {[
            [
              "Lost wallet or private key",
              "A ticket is an NFT held entirely in the user's wallet. If the keys are lost, the ticket is unrecoverable - there is no backend override or custodial recovery. This is the cost of genuine self-custody.",
            ],
            [
              "The resale cap can be bypassed off-platform",
              "The cap is enforced by the TicketMarketplace contract. EventTicket is a standard ERC-721 with unrestricted transfers, so a holder can transfer wallet-to-wallet or list on a generic NFT marketplace and sidestep the cap. Today the cap is guaranteed only for sales settled through TruTix; making it universal would require restricting transfers at the token level, which is future work.",
            ],
            [
              "Gate scan failure",
              "Verification is online-only and fails closed. If a phone is dead, there is no signal, or a signature does not match, entry is not granted on a guess. There is no offline override in this release (an offline scanner queue is future scope); resolution is at the organizer's discretion at the venue.",
            ],
            [
              "Event cancellation & refunds",
              "The protocol is non-custodial: primary-sale proceeds accrue to the organizer's on-chain balance and resale settles directly between parties. No funds are escrowed, so refunds are the organizer's responsibility - the protocol does not and cannot issue them automatically.",
            ],
            [
              "QR screenshot / replay",
              "Mitigated: the gate signature is timestamped and refreshed on a timer, and the server rejects stale signatures, so a screenshot expires quickly.",
            ],
          ].map(([h, b]) => (
            <li key={h} className="rounded-xl border border-ink-700 bg-ink-900/60 p-4">
              <p className="font-medium text-slate-100">{h}</p>
              <p className="mt-1 text-sm text-slate-400">{b}</p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "security",
    num: "11",
    title: "Trust, Security & Audit Status",
    content: (
      <div className="space-y-4">
        <p>
          TruTix is non-custodial by design - the backend never holds tickets or funds, and resale
          settlement happens entirely on-chain. Access is split into three tiers that are never
          blurred:
        </p>
        <ul className="space-y-2">
          {[
            ["Attendee", "Connects a wallet only. No backend session is created."],
            [
              "Organizer",
              "Authenticates with Sign-In-With-Ethereum (nonce → sign → JWT) for off-chain content writes.",
            ],
            ["Staff", "Holds an organizer-issued token scoped to one specific event and venue."],
          ].map(([h, b]) => (
            <li key={h} className="flex gap-3">
              <Badge tone="brand" className="mt-0.5 shrink-0">
                {h}
              </Badge>
              <span className="text-slate-400">{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-slate-400">
          The API is hardened with rate limiting, a CORS allowlist, and security headers, and the
          gate&rsquo;s redeemer key fails closed in production rather than degrading silently.
        </p>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Audit status.</strong> TruTix is deployed on Base Sepolia (testnet only) and has
          not undergone a third-party smart-contract audit. EventTicket and TicketMarketplace should
          be treated as experimental - do not mint or trade tickets backed by funds you cannot
          afford to lose. A formal audit and production key management are planned ahead of any
          mainnet deployment. Vulnerability reports can be sent via the project&rsquo;s GitHub
          issues.
        </p>
      </div>
    ),
  },
  {
    id: "fees",
    num: "12",
    title: "Fees & Sustainability",
    content: (
      <div className="space-y-4">
        <p>
          TruTix charges <strong>no platform fee</strong> in this release. On a primary mint, 100%
          of the price accrues to the organizer. On a resale, the marketplace splits the payment
          between the seller and the ERC-2981 royalty receiver (the organizer/creator) only - the
          protocol takes nothing in between.
        </p>
        <p className="text-slate-400">
          This answers a fair question directly: because we frame &ldquo;creators earn nothing on
          resale&rdquo; as the problem, it matters that the creator royalty flows entirely to the
          organizer and is not skimmed by a TruTix cut. A sustainable fee model may be proposed
          ahead of mainnet; if introduced, it would be disclosed here and kept separate from the
          creator royalty.
        </p>
      </div>
    ),
  },
  {
    id: "roadmap",
    num: "13",
    title: "Roadmap",
    content: (
      <div className="space-y-3">
        <p className="text-slate-400">
          Each item is marked done or planned. We do not commit to dates we cannot yet guarantee.
        </p>
        <ul className="space-y-2">
          {[
            [
              "Core protocol",
              "done",
              "EventTicket + TicketMarketplace, fully on-chain metadata, and resale-cap enforcement on the marketplace.",
            ],
            [
              "Gate identity",
              "done",
              "Wallet-signed QR, ecrecover verification, and fail-closed scanning.",
            ],
            [
              "Audit & hardening",
              "planned",
              "Third-party contract audit, production key management, and a decision on token-level transfer restrictions to make the cap universal.",
            ],
            [
              "Mainnet & ecosystem",
              "planned",
              "Base mainnet deployment, plus items currently out of scope: IPFS/Pinata fallback, WalletConnect, and an offline scanner queue.",
            ],
          ].map(([h, status, b]) => (
            <li key={h} className="flex gap-3 rounded-xl border border-ink-700 bg-ink-900/60 p-4">
              <Badge tone={status === "done" ? "success" : "neutral"} className="mt-0.5 shrink-0">
                {status === "done" ? "Done" : "Planned"}
              </Badge>
              <span>
                <strong className="text-slate-100">{h}.</strong>{" "}
                <span className="text-slate-400">{b}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "governance",
    num: "14",
    title: "Project Status & Governance",
    content: (
      <div className="space-y-4">
        <p>
          TruTix is an early-stage project. Its smart contracts are developed in-house and are open
          for inspection on Base Sepolia. There is no token, no DAO, and no on-chain governance -
          per-event parameters (price, resale cap, royalty) are set by each event&rsquo;s organizer
          at creation and are immutable thereafter.
        </p>
        <p className="text-slate-400">
          Team identities and a formal governance and disclosure policy will be published ahead of
          any mainnet deployment. Until then, this should be treated as a technical demonstration
          rather than a production service.
        </p>
      </div>
    ),
  },
];

const references = [
  ["ERC-721: Non-Fungible Token Standard", "https://eips.ethereum.org/EIPS/eip-721"],
  ["ERC-2981: NFT Royalty Standard", "https://eips.ethereum.org/EIPS/eip-2981"],
  ["EIP-191: Signed Data Standard", "https://eips.ethereum.org/EIPS/eip-191"],
  ["Base - Documentation", "https://docs.base.org"],
  ["GET Protocol - NFT Ticketing", "https://get-protocol.io/"],
  [
    "The Business Research Company - Online Event Ticketing Market Report",
    "https://www.thebusinessresearchcompany.com/report/online-event-ticketing-global-market-report",
  ],
];

const glossary = [
  ["NFT", "A non-fungible token - a unique, verifiably owned asset on a blockchain."],
  ["ERC-2981", "The royalty standard that lets a token signal a creator fee to marketplaces."],
  ["ecrecover", "An EVM operation that recovers the signer's address from a message signature."],
  ["Redemption flag", "A one-way on-chain marker set when a ticket is used at the gate."],
  ["Resale cap", "The maximum resale price an organizer allows, enforced by the contract."],
  ["Royalty (bps)", "The creator's resale fee in basis points (100 bps = 1%)."],
  [
    "Non-custodial",
    "A design where the platform never holds your assets or funds; control stays in your wallet.",
  ],
];

const stack = [
  ["Network", "Base Sepolia (OP Stack L2 testnet)"],
  ["Contracts", "Solidity · Hardhat · ERC-721 + ERC-2981"],
  ["Backend", "Express · Mongoose · viem · SIWE + JWT"],
  ["Frontend", "Vite · React · wagmi / viem"],
  ["Metadata", "Fully on-chain JSON + SVG (no IPFS)"],
];

/// Full table of contents: the body sections plus the two trailing sections,
/// so the same list drives both the sidebar and the active-section tracking.
const toc = [
  ...sections.map((s) => ({ id: s.id, num: s.num, title: s.title })),
  { id: "references", num: "15", title: "References" },
  { id: "appendix", num: "16", title: "Appendix" },
];
const tocIds = toc.map((t) => t.id);

/// Tracks which section is currently in the reading zone (upper third of the
/// viewport) so the table of contents can highlight where the reader is.
function useActiveSection(): string {
  const [active, setActive] = useState(tocIds[0] ?? "");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Active when a heading sits in the top ~25% band of the screen.
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const id of tocIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

/// Page scroll progress as a 0–100 percentage, for the top reading bar.
function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

export function Whitepaper() {
  const active = useActiveSection();
  const progress = useScrollProgress();

  return (
    <div className="space-y-12">
      {/* Reading-progress bar, fixed across the very top of the viewport.
          Rendered through a portal to <body> so it escapes the page's
          `animate-rise` wrapper - a transformed ancestor would otherwise
          become its containing block and make the "fixed" bar scroll away. */}
      {createPortal(
        <div
          className="fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-brand-500 to-citrus-400 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />,
        document.body,
      )}

      {/* Cover */}
      <header className="overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-8 shadow-card sm:p-12">
        <Badge tone="brand">White Paper · v1.0 · June 2026</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-5xl">
          TruTix -{" "}
          <span className="bg-gradient-to-r from-brand-400 to-citrus-400 bg-clip-text text-transparent">
            Tickets You Actually Own
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          A trust-minimized protocol for NFT event ticketing with on-chain anti-scalping, enforced
          creator royalties, and cryptographic gate identity.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="neutral">Base Sepolia</Badge>
          <Badge tone="neutral">ERC-721 + ERC-2981</Badge>
          <Badge tone="neutral">Non-custodial</Badge>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[170px_1fr] lg:gap-8">
        {/* Table of contents */}
        <aside className="mb-8 lg:sticky lg:top-28 lg:mb-0 lg:-ml-6 lg:h-fit">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Contents
          </p>
          <nav className="space-y-px">
            {toc.map((t) => {
              const isActive = active === t.id;
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex gap-2 rounded-md border-l-2 px-2 py-1 text-[13px] leading-snug transition",
                    isActive
                      ? "border-brand-500 bg-ink-800 font-medium text-slate-100"
                      : "border-transparent text-slate-400 hover:bg-ink-800/60 hover:text-slate-100",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      isActive ? "text-citrus-300" : "text-brand-400",
                    )}
                  >
                    {t.num}
                  </span>
                  {t.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Body */}
        <article className="min-w-0 space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
              <h2 className="flex items-baseline gap-3 text-2xl font-bold">
                <span className="font-mono text-base text-brand-400">{s.num}</span>
                {s.title}
              </h2>
              <div className="leading-relaxed text-slate-300 [&_code]:rounded [&_code]:bg-ink-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-citrus-300">
                {s.content}
              </div>
            </section>
          ))}

          {/* Call to action */}
          <section className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-citrus-500/15 text-citrus-300">
                <TicketIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg text-slate-100">For attendees</h3>
                <p className="text-sm text-slate-400">
                  Browse events and mint a ticket straight to your wallet - yours to keep, resell,
                  or show at the gate.
                </p>
              </div>
              <ButtonLink to="/events" className="mt-auto w-fit">
                Browse events
              </ButtonLink>
            </Card>
            <Card className="flex flex-col gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                <ScanIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg text-slate-100">For organizers</h3>
                <p className="text-sm text-slate-400">
                  Create an event in minutes with named tiers, an on-chain resale cap, and automatic
                  royalties.
                </p>
              </div>
              <ButtonLink to="/org" variant="secondary" className="mt-auto w-fit">
                Organizer dashboard
              </ButtonLink>
            </Card>
          </section>

          {/* References */}
          <section id="references" className="scroll-mt-28 space-y-4">
            <h2 className="flex items-baseline gap-3 text-2xl font-bold">
              <span className="font-mono text-base text-brand-400">15</span>
              References
            </h2>
            <ol className="space-y-2 text-sm">
              {references.map(([label, url], i) => (
                <li key={url} className="flex gap-3">
                  <span className="font-mono text-xs text-slate-500">[{i + 1}]</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-300 underline-offset-2 hover:text-brand-200 hover:underline"
                  >
                    {label} ↗
                  </a>
                </li>
              ))}
            </ol>
          </section>

          {/* Appendix */}
          <section id="appendix" className="scroll-mt-28 space-y-6">
            <h2 className="flex items-baseline gap-3 text-2xl font-bold">
              <span className="font-mono text-base text-brand-400">16</span>
              Appendix
            </h2>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-lg text-slate-100">
                <ShieldIcon className="h-5 w-5 text-brand-300" /> Glossary
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {glossary.map(([term, def]) => (
                  <div key={term} className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
                    <dt className="font-mono text-sm text-citrus-300">{term}</dt>
                    <dd className="mt-1 text-sm text-slate-400">{def}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-lg text-slate-100">
                <StoreIcon className="h-5 w-5 text-brand-300" /> Technology stack
              </h3>
              <dl className="divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-700">
                {stack.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 bg-ink-900/60 px-4 py-2.5">
                    <dt className="text-sm text-slate-500">{k}</dt>
                    <dd className="text-right text-sm text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-lg text-slate-100">
                <TicketIcon className="h-5 w-5 text-brand-300" /> Deployed contracts (Base Sepolia)
              </h3>
              <dl className="divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-700">
                {deployedContracts.map(([name, address]) => (
                  <div key={name} className="flex justify-between gap-4 bg-ink-900/60 px-4 py-2.5">
                    <dt className="text-sm text-slate-500">{name}</dt>
                    <dd className="text-right text-sm">
                      {address ? (
                        <a
                          href={explorerAddressUrl(address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-brand-300 underline-offset-2 hover:text-brand-200 hover:underline"
                        >
                          {formatAddress(address)}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">not configured</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="text-xs text-slate-500">
              Items previously listed as future scope (IPFS / Pinata, WalletConnect, Redis, PWA
              service worker, and an offline scanner queue) are tracked with status in the Roadmap
              above.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
