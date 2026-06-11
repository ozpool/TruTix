import { Link } from "react-router-dom";

export function Landing() {
  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-bold">Tickets you actually own.</h1>
      <p className="max-w-xl text-slate-300">
        NFT event tickets on Base with anti-scalping resale caps, creator royalties, and a
        cryptographic gate check. No silent duplicates, no scalper markups.
      </p>
      <div className="flex gap-3">
        <Link
          to="/events"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
        >
          Browse events
        </Link>
        <Link
          to="/resale"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium hover:border-slate-500"
        >
          Resale market
        </Link>
      </div>
    </section>
  );
}
