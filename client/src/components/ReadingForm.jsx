import { useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../api";
import { SLOTS } from "../slots";
import { formatDate } from "../dates";
import { btnPrimary, btnText } from "../ui";
import ConfirmDialog from "./ConfirmDialog";
import FormError from "./FormError";
import useScrollLock from "../useScrollLock";

export default function ReadingForm({
  date,
  slot,
  onSlot,
  readings,
  sheetOpen,
  disabled = false,
  onClose,
  onDone,
}) {
  const reading = readings.find((item) => item.slot === slot) || null;

  const [value, setValue] = useState(() =>
    reading ? String(reading.value) : "",
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef(null);
  const busyRef = useRef(false);

  const locked = saving || deleting || disabled;

  useScrollLock(sheetOpen, true);

  // Focus the number field when the mobile sheet opens.
  useEffect(() => {
    if (sheetOpen) {
      inputRef.current?.focus();
    }
  }, [sheetOpen, slot]);

  async function submit(event) {
    event.preventDefault();

    if (busyRef.current || disabled) return;

    busyRef.current = true;
    setError("");
    setSaving(true);

    try {
      const body = {
        date,
        slot,
        value,
      };

      if (reading) {
        await api.put(`/readings/${reading.id}`, body);
      } else {
        await api.post("/readings", body);
      }

      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  async function remove() {
    if (busyRef.current || !reading) return;

    busyRef.current = true;
    setDeleting(true);

    try {
      await api.delete(`/readings/${reading.id}`);

      setConfirming(false);
      onDone();
    } catch (err) {
      setConfirming(false);
      setError(errorMessage(err));
    } finally {
      busyRef.current = false;
      setDeleting(false);
    }
  }

  const slotLabel = SLOTS.find((item) => item.value === slot)?.label;

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
          {SLOTS.map((item) => {
            const active = item.value === slot;
            const filled = readings.some((entry) => entry.slot === item.value);

            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                disabled={locked}
                onClick={() => onSlot(item.value)}
                className={`press flex min-h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-semibold ${
                  active ? "bg-ink text-white" : "bg-chip text-ink"
                }`}
              >
                {item.label}

                {filled && (
                  <span
                    className={`size-1.5 rounded-full ${
                      active ? "bg-mint" : "bg-brand"
                    }`}
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
          className={`flex items-baseline gap-2 border-b-2 pb-2.5 transition-colors ${
            error ? "border-danger" : "border-ink/20 focus-within:border-ink"
          }`}
        >
          <input
            ref={inputRef}
            id="value"
            inputMode="numeric"
            autoComplete="off"
            placeholder="110"
            value={value}
            readOnly={locked}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "value-error" : undefined}
            className="min-w-0 flex-1 bg-transparent text-5xl font-bold tracking-display outline-none placeholder:text-faint/50"
          />

          <span className="text-base font-medium text-muted">mg/dl</span>
        </div>

        <div className="mb-7 mt-3 min-h-5">
          <FormError id="value-error">{error}</FormError>
        </div>

        <button type="submit" className={btnPrimary} disabled={locked}>
          {saving ? "Saving…" : reading ? "Save changes" : "Save reading"}
        </button>

        <div className="mt-1 flex justify-center">
          {reading && (
            <button
              type="button"
              disabled={locked}
              onClick={() => setConfirming(true)}
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

      <ConfirmDialog
        open={confirming}
        title="Delete this reading?"
        message={
          reading
            ? `${slotLabel}, ${reading.value} mg/dl on ${formatDate(date)}. This can't be undone.`
            : ""
        }
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
