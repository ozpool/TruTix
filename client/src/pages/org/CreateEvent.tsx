import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../org/context";
import { useCreateEvent } from "../../hooks/useCreateEvent";

const inputClass = "w-full rounded bg-slate-800 px-3 py-2 text-sm";

/// Create-event form. The id is generated for the organizer; they only describe
/// the event. Submitting writes on-chain, then saves the off-chain content.
export function CreateEvent() {
  const { token } = useOrg();
  const navigate = useNavigate();
  const { phase, error, txError, eventId, submit } = useCreateEvent(token);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [maxResalePct, setMaxResalePct] = useState("20");
  const [royaltyPct, setRoyaltyPct] = useState("5");
  const [startsAt, setStartsAt] = useState("");
  const [prices, setPrices] = useState<string[]>(["0.01"]);

  if (phase === "done") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Event created</h1>
        <p className="text-emerald-400">Event #{eventId?.toString()} is live.</p>
        <button className="text-sm underline" onClick={() => navigate("/org")}>
          Back to dashboard
        </button>
      </section>
    );
  }

  const busy = phase === "confirming" || phase === "saving";

  return (
    <section className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Create event</h1>

      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Description">
        <textarea
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Capacity">
          <input
            className={inputClass}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </Field>
        <Field label="Resale cap %">
          <input
            className={inputClass}
            value={maxResalePct}
            onChange={(e) => setMaxResalePct(e.target.value)}
          />
        </Field>
        <Field label="Royalty %">
          <input
            className={inputClass}
            value={royaltyPct}
            onChange={(e) => setRoyaltyPct(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Starts at">
        <input
          type="datetime-local"
          className={inputClass}
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </Field>
      <Field label="Tier prices (ETH)">
        <div className="space-y-2">
          {prices.map((p, i) => (
            <input
              key={i}
              className={inputClass}
              value={p}
              onChange={(e) => setPrices((ps) => ps.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <button
            type="button"
            className="text-sm text-slate-400 underline"
            onClick={() => setPrices((ps) => [...ps, "0.01"])}
          >
            Add tier
          </button>
        </div>
      </Field>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {txError && <p className="text-sm text-rose-400">Transaction rejected.</p>}
      <button
        className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold disabled:opacity-50"
        disabled={busy}
        onClick={() =>
          submit({ name, description, capacity, maxResalePct, royaltyPct, startsAt, prices })
        }
      >
        {phase === "confirming"
          ? "Confirm in wallet…"
          : phase === "saving"
            ? "Saving…"
            : "Create event"}
      </button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm text-slate-400">{label}</span>
      {children}
    </label>
  );
}
