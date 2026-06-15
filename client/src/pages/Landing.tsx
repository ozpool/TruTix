import { ButtonLink } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ShieldIcon, TicketIcon, StoreIcon } from "../components/ui/icons";

const features = [
  {
    icon: <TicketIcon className="h-6 w-6" />,
    title: "You actually own it",
    body: "Every ticket is an NFT in your wallet — no account to lock you out, no silent duplicates.",
  },
  {
    icon: <ShieldIcon className="h-6 w-6" />,
    title: "Scalping capped on-chain",
    body: "Resale above the organizer's cap doesn't fail in the UI — the contract itself refuses it.",
  },
  {
    icon: <StoreIcon className="h-6 w-6" />,
    title: "Royalties that follow",
    body: "Creators earn on every resale automatically, settled on-chain at the moment of sale.",
  },
];

export function Landing() {
  return (
    <div className="space-y-16">
      <section className="space-y-7">
        <Badge tone="brand">Base Sepolia · live demo</Badge>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Tickets you{" "}
          <span className="bg-gradient-to-r from-brand-400 to-citrus-400 bg-clip-text text-transparent">
            actually own.
          </span>
        </h1>
        <p className="max-w-xl text-lg text-slate-300">
          NFT event tickets with anti-scalping resale caps, creator royalties, and a cryptographic
          gate check. No silent duplicates, no scalper markups.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/events">Browse events</ButtonLink>
          <ButtonLink to="/resale" variant="secondary">
            Resale market
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5 transition hover:border-brand-500/40"
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
              {f.icon}
            </div>
            <h2 className="font-display text-base text-slate-100">{f.title}</h2>
            <p className="mt-1.5 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
