import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../org/context";
import { useCreateEvent } from "../../hooks/useCreateEvent";
import { Card } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { TxStatus } from "../../components/ui/TxStatus";
import { TxLink } from "../../components/ui/TxLink";
import { CheckIcon } from "../../components/ui/icons";

/// Common real-world tier names, offered as suggestions on the tier-name input.
const TIER_PRESETS = [
  "General Admission",
  "Early Bird",
  "Silver",
  "Gold",
  "Platinum",
  "VIP",
  "Balcony",
  "Floor",
];

interface Tier {
  name: string;
  price: string;
}

/// A labelled group of related fields, so the long form reads as distinct
/// sections (Basics → Schedule → Pricing → Anti-scalping) instead of one wall.
function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-ink-700 pt-5 first:border-t-0 first:pt-0">
      <legend className="space-y-0.5">
        <span className="font-display text-base text-slate-100">{title}</span>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </legend>
      {children}
    </fieldset>
  );
}

/// Create-event form. The id is generated for the organizer; they only describe
/// the event. Submitting writes on-chain, then saves the off-chain content.
export function CreateEvent() {
  const { token } = useOrg();
  const navigate = useNavigate();
  const { phase, error, txError, warning, eventId, txHash, submit } = useCreateEvent(token);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [maxResalePct, setMaxResalePct] = useState("20");
  const [royaltyPct, setRoyaltyPct] = useState("5");
  const [startsAt, setStartsAt] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([{ name: "General Admission", price: "0.01" }]);

  function setTier(i: number, patch: Partial<Tier>) {
    setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }

  if (phase === "done") {
    return (
      <section className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Event created</h1>
        <p className="text-emerald-400">Event #{eventId?.toString()} is live.</p>
        {txHash && (
          <p className="text-sm">
            <TxLink hash={txHash} label="View the creation transaction on BaseScan" />
          </p>
        )}
        {warning && <TxStatus tone="warn">{warning}</TxStatus>}
        <div className="flex justify-center gap-3 pt-2">
          <ButtonLink to={`/events/${eventId?.toString()}`}>View event page</ButtonLink>
          <ButtonLink to="/org" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </section>
    );
  }

  const busy = phase === "confirming" || phase === "granting";

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1">
        <button
          className="text-sm text-slate-400 hover:text-slate-200"
          onClick={() => navigate("/org")}
        >
          ← Organizer
        </button>
        <h1 className="text-3xl font-bold">Create event</h1>
        <p className="text-sm text-slate-400">
          Describe the event and its pricing. We write the rules on-chain and authorize your gate
          scanner automatically.
        </p>
      </div>

      <Card className="space-y-6">
        <Section title="Basics" hint="What attendees see first.">
          <Field label="Event name">
            {(p) => (
              <Input
                {...p}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Bass Festival 2026"
              />
            )}
          </Field>
          <Field
            label="Description"
            hint="Line-up, venue, what to bring — this shows on the event page."
          >
            {(p) => (
              <textarea
                {...p}
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </Field>
        </Section>

        <Section title="Schedule & size">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts at" hint="Must be a future date and time.">
              {(p) => (
                <Input
                  {...p}
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              )}
            </Field>
            <Field label="Capacity" hint="Total tickets across all tiers.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              )}
            </Field>
          </div>
        </Section>

        <Section
          title="Pricing tiers"
          hint="Name each tier like real life — Platinum, Silver, Balcony — and set its price in ETH."
        >
          <datalist id="tier-presets">
            {TIER_PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_auto] items-center gap-2">
                <Input
                  aria-label={`Tier ${i + 1} name`}
                  list="tier-presets"
                  placeholder="Tier name"
                  value={t.name}
                  onChange={(e) => setTier(i, { name: e.target.value })}
                />
                <Input
                  aria-label={`Tier ${i + 1} price in ETH`}
                  inputMode="decimal"
                  placeholder="ETH"
                  value={t.price}
                  onChange={(e) => setTier(i, { price: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={`Remove tier ${i + 1}`}
                  disabled={tiers.length === 1}
                  className="px-2 text-slate-500 hover:text-rose-300 disabled:opacity-30"
                  onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-medium text-brand-300 hover:text-brand-200"
              onClick={() => setTiers((ts) => [...ts, { name: "", price: "0.01" }])}
            >
              + Add tier
            </button>
          </div>
        </Section>

        <Section
          title="Anti-scalping rules"
          hint="Enforced on-chain. Resale above the cap is rejected by the contract."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Resale cap %" hint="Max markup over face price.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min="0"
                  value={maxResalePct}
                  onChange={(e) => setMaxResalePct(e.target.value)}
                />
              )}
            </Field>
            <Field label="Royalty %" hint="Your cut on every resale.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min="0"
                  value={royaltyPct}
                  onChange={(e) => setRoyaltyPct(e.target.value)}
                />
              )}
            </Field>
          </div>
        </Section>

        {error && <TxStatus tone="danger">{error}</TxStatus>}
        {txError && <TxStatus tone="danger">Transaction rejected in your wallet.</TxStatus>}

        <Button
          className="w-full"
          loading={busy}
          onClick={() =>
            submit({
              name,
              description,
              capacity,
              maxResalePct,
              royaltyPct,
              startsAt,
              prices: tiers.map((t) => t.price),
              names: tiers.map((t) => t.name),
            })
          }
        >
          {phase === "confirming"
            ? "Confirm in wallet…"
            : phase === "granting"
              ? "Authorizing scanner…"
              : "Create event"}
        </Button>
      </Card>
    </section>
  );
}
