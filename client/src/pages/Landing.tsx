import { ButtonLink } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ShieldIcon, TicketIcon, StoreIcon, ScanIcon } from "../components/ui/icons";

const features = [
  {
    icon: <TicketIcon className="h-6 w-6" />,
    title: "You actually own it",
    body: "Every ticket is an NFT held in your own wallet — not a row in a database someone else controls. No account to lock you out, no silent duplicates printed behind your back.",
  },
  {
    icon: <ShieldIcon className="h-6 w-6" />,
    title: "Scalping capped on-chain",
    body: "The organizer sets a maximum resale price. Listing above it doesn't just fail in the app — the smart contract itself refuses the sale. The cap is a rule, not a suggestion.",
  },
  {
    icon: <StoreIcon className="h-6 w-6" />,
    title: "Royalties that follow",
    body: "Creators earn a percentage on every resale, forever. It's settled on-chain the moment a ticket changes hands — no invoicing, no trust required.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect your wallet",
    body: "MetaMask on Base Sepolia. No sign-up form, no password — your wallet is your identity.",
  },
  {
    n: "02",
    title: "Mint a ticket",
    body: "Pick an event and a tier, pay the face price, and the NFT lands in your wallet. You get a live link to track the transaction confirm.",
  },
  {
    n: "03",
    title: "Show your pass at the gate",
    body: "Your ticket generates a wallet-signed QR code that refreshes every minute. Staff scan it; the chain verifies it's really you.",
  },
  {
    n: "04",
    title: "Resell within the cap",
    body: "Done early? List it on the resale market at or below the organizer's cap. Settlement and royalties happen automatically on-chain.",
  },
];

export function Landing() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-7">
        <Badge tone="brand">Base Sepolia · live demo</Badge>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Tickets you{" "}
          <span className="bg-gradient-to-r from-brand-400 to-citrus-400 bg-clip-text text-transparent">
            actually own.
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          TruTix turns every event ticket into an NFT in your wallet, with anti-scalping resale caps
          enforced by the contract, creator royalties on every resale, and a cryptographic gate
          check at the door. No silent duplicates. No scalper markups. No middleman holding your
          ticket hostage.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/events">Browse events</ButtonLink>
          <ButtonLink to="/resale" variant="secondary">
            Resale market
          </ButtonLink>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="text-sm text-slate-400">From wallet to gate in four steps.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex h-full flex-col rounded-2xl border border-ink-700 bg-ink-900/60 p-5"
            >
              <span className="font-mono text-sm text-brand-400">{s.n}</span>
              <h3 className="mt-2 font-display text-base text-slate-100">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why it's different */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Why it's different</h2>
          <p className="text-sm text-slate-400">
            The guarantees live in the smart contract — not in our terms of service.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex h-full flex-col rounded-2xl border border-ink-700 bg-ink-900/60 p-5 transition hover:border-brand-500/40"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                {f.icon}
              </div>
              <h3 className="font-display text-base text-slate-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience split */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-citrus-500/15 text-citrus-300">
            <TicketIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg text-slate-100">Going to an event?</h3>
            <p className="text-sm text-slate-400">
              Mint a ticket straight to your wallet, keep it safe, and flash a signed QR at the
              gate. Can't make it? Resell it fairly — capped, with royalties handled for you.
            </p>
          </div>
          <ButtonLink to="/events" className="mt-auto w-fit">
            Find an event
          </ButtonLink>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
            <ScanIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg text-slate-100">Running an event?</h3>
            <p className="text-sm text-slate-400">
              Create an event in minutes: name your tiers, set capacity, pick a resale cap and a
              royalty. We deploy the on-chain rules and authorize your gate scanner automatically.
            </p>
          </div>
          <ButtonLink to="/org" variant="secondary" className="mt-auto w-fit">
            Organizer dashboard
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
