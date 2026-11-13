import { useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../api";
import { SLOTS } from "../slots";
import { formatDate } from "../dates";
import { btnPrimary, btnText } from "../ui";
import FormError from "./FormError";

export default function ReadingForm({
  date,
  slot,
  onSlot,
  readings,
  sheetOpen,
  onClose,
  onDone,
}) {
  const reading = readings.find((r) => r.slot === slot) || null;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // Prefill when the selected slot (or its reading) changes.
  useEffect(() => {
    setValue(reading ? String(reading.value) : "");
    setError("");
  }, [reading?.id, reading?.value, slot, date]);

  // On open, focus the number field so the numeric keyboard appears.
  useEffect(() => {
    if (sheetOpen) inputRef.current?.focus();
  }, [sheetOpen, slot]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = { date, slot, value };
      if (reading) await api.put(`/readings/${reading.id}`, body);
      else await api.post("/readings", body);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this reading?")) return;
    try {
      await api.delete(`/readings/${reading.id}`);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      {sheetOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-30 animate-fade-in bg-ink/40 motion-reduce:animate-none lg:hidden"
        />
      )}

      <form
        onSubmit={submit}
        className={`${
          sheetOpen
            ? "fixed inset-x-0 bottom-0 z-40 animate-sheet-in rounded-t-[28px] bg-white px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_40px_rgb(17_18_20/0.18)] motion-reduce:animate-none"
            : "hidden"
        } lg:sticky lg:top-24 lg:block lg:animate-none lg:rounded-3xl lg:border lg:border-ink/5 lg:bg-white lg:p-7 lg:shadow-card`}
      >
        <div className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-[#D6D8DC] lg:hidden" />

        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[22px] font-bold tracking-tight lg:text-[13px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-muted">
            {reading ? "Edit reading" : "Add a reading"}
          </h2>
          <span className="text-sm font-medium text-muted lg:hidden">
            {formatDate(date)}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {SLOTS.map((s) => {
            const on = s.value === slot;
            const filled = readings.some((r) => r.slot === s.value);
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => onSlot(s.value)}
                className={`press flex min-h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-semibold ${on ? "bg-ink text-white" : "bg-chip text-ink"}`}
              >
                {s.label}
                {filled && (
                  <span
                    className={`size-1.5 rounded-full ${on ? "bg-mint" : "bg-brand"}`}
                    aria-label="has a reading"
                  />
                )}
              </button>
            );
          })}
        </div>

        <label htmlFor="value" className="mb-2 block text-[13px] font-semibold">
          Glucose
        </label>
        <div
          className={`flex items-baseline gap-2 border-b-2 pb-2.5 transition-colors ${error ? "border-danger" : "border-ink/20 focus-within:border-ink"}`}
        >
          <input
            ref={inputRef}
            id="value"
            inputMode="numeric"
            autoComplete="off"
            placeholder="110"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "value-error" : undefined}
            className="min-w-0 flex-1 bg-transparent text-5xl font-bold tracking-display outline-none placeholder:text-faint/50"
          />
          <span className="text-base font-medium text-muted">mg/dl</span>
        </div>
        <div className="mb-7 mt-3 min-h-5">
          <FormError id="value-error">{error}</FormError>
        </div>

        <button className={btnPrimary} disabled={saving}>
          {saving ? "Saving…" : reading ? "Save changes" : "Save reading"}
        </button>
        <div className="mt-1 flex justify-center">
          {reading && (
            <button
              type="button"
              onClick={remove}
              className={`${btnText} !text-danger`}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${btnText} lg:hidden`}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
