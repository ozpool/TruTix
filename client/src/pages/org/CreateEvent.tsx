import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../org/context";
import { useCreateEvent } from "../../hooks/useCreateEvent";
import { Card } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { TxStatus } from "../../components/ui/TxStatus";
import { CheckIcon } from "../../components/ui/icons";

/// Create-event form. The id is generated for the organizer; they only describe
/// the event. Submitting writes on-chain, then saves the off-chain content.
export function CreateEvent() {
  const { token } = useOrg();
  const navigate = useNavigate();
  const { phase, error, txError, warning, eventId, submit } = useCreateEvent(token);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [maxResalePct, setMaxResalePct] = useState("20");
  const [royaltyPct, setRoyaltyPct] = useState("5");
  const [startsAt, setStartsAt] = useState("");
  const [prices, setPrices] = useState<string[]>(["0.01"]);

  if (phase === "done") {
    return (
      <section className="mx-auto max-w-md space-y-4 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckIcon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Event created</h1>
        <p className="text-emerald-400">Event #{eventId?.toString()} is live.</p>
        {warning && <TxStatus tone="warn">{warning}</TxStatus>}
        <ButtonLink to="/org" variant="secondary">
          Back to dashboard
        </ButtonLink>
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
      </div>

      <Card className="space-y-5">
        <Field label="Name">
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Description">
          {(p) => (
            <textarea
              {...p}
              className="w-full rounded-xl border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Capacity">
            {(p) => <Input {...p} value={capacity} onChange={(e) => setCapacity(e.target.value)} />}
          </Field>
          <Field label="Resale cap %">
            {(p) => (
              <Input
                {...p}
                value={maxResalePct}
                onChange={(e) => setMaxResalePct(e.target.value)}
              />
            )}
          </Field>
          <Field label="Royalty %">
            {(p) => (
              <Input {...p} value={royaltyPct} onChange={(e) => setRoyaltyPct(e.target.value)} />
            )}
          </Field>
        </div>

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

        <Field label="Tier prices (ETH)">
          {() => (
            <div className="space-y-2">
              {prices.map((tp, i) => (
                <Input
                  key={i}
                  aria-label={`Tier ${i} price in ETH`}
                  value={tp}
                  onChange={(e) =>
                    setPrices((ps) => ps.map((v, j) => (j === i ? e.target.value : v)))
                  }
                />
              ))}
              <button
                type="button"
                className="text-sm font-medium text-brand-300 hover:text-brand-200"
                onClick={() => setPrices((ps) => [...ps, "0.01"])}
              >
                + Add tier
              </button>
            </div>
          )}
        </Field>

        {error && <TxStatus tone="danger">{error}</TxStatus>}
        {txError && <TxStatus tone="danger">Transaction rejected in your wallet.</TxStatus>}

        <Button
          className="w-full"
          loading={busy}
          onClick={() =>
            submit({ name, description, capacity, maxResalePct, royaltyPct, startsAt, prices })
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
