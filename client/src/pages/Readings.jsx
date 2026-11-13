import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { SLOTS } from "../slots";
import { card } from "../ui";
import {
  dayNumber,
  formatLong,
  todayString,
  weekdayShort,
  weekDays,
} from "../dates";
import DateChip from "../components/DateChip";
import FormError from "../components/FormError";
import ReadingForm from "../components/ReadingForm";

const firstEmptySlot = (readings) =>
  SLOTS.find((s) => !readings.some((r) => r.slot === s.value))?.value ??
  "morning";

function DateStrip({ date, onChange }) {
  const today = todayString();
  return (
    <div className="mb-6 flex gap-1.5">
      {weekDays(date).map((d) => {
        const on = d === date;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={formatLong(d)}
            onClick={() => onChange(d)}
            className={`press flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-base font-semibold ${
              on ? "bg-ink text-white" : d > today ? "text-faint" : "text-ink"
            }`}
          >
            <span
              className={`text-[11px] font-medium ${on ? "text-white/70" : "text-muted"}`}
            >
              {weekdayShort(d)}
            </span>
            {dayNumber(d)}
          </button>
        );
      })}
    </div>
  );
}

function SlotRow({ slot, reading, active, last, onPick }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`press flex min-h-[72px] w-full items-center gap-3.5 px-5 text-left lg:px-6 ${last ? "" : "border-b border-ink/5"} ${active ? "lg:bg-chip/60" : ""}`}
    >
      {reading ? (
        <span className="grid size-8 place-items-center rounded-full bg-brand-tint">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0B6B52"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      ) : (
        <span className="size-8 rounded-full border-[1.5px] border-dashed border-faint" />
      )}
      <span
        className={`flex-1 text-base font-semibold ${reading ? "" : "text-muted"}`}
      >
        {slot.label}
      </span>
      {reading ? (
        <span className="text-2xl font-bold tracking-tight">
          {reading.value}
          <small className="ml-1 text-xs font-medium text-muted">mg/dl</small>
        </span>
      ) : (
        <span className="rounded-full bg-brand-tint px-4 py-2.5 text-sm font-semibold text-brand">
          Add
        </span>
      )}
    </button>
  );
}

export default function Readings() {
  const [date, setDate] = useState(todayString());
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slot, setSlot] = useState(null); // selected slot key
  const [sheetOpen, setSheetOpen] = useState(false); // mobile bottom sheet

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/readings", { params: { date } });
      setReadings(data.readings);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  // Once data is in, default to the first slot that has no reading yet.
  useEffect(() => {
    if (!loading && slot === null) setSlot(firstEmptySlot(readings));
  }, [loading, slot, readings]);

  const changeDate = (d) => {
    setSlot(null);
    setLoading(true);
    setSheetOpen(false);
    setDate(d);
  };

  const afterSave = () => {
    setSheetOpen(false);
    setSlot(null);
    setLoading(true);
    load();
  };

  const logged = SLOTS.filter((s) =>
    readings.some((r) => r.slot === s.value),
  ).length;

  return (
    <>
      <div className="mb-5 flex items-end justify-between lg:mb-8">
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted lg:mb-2 lg:text-[15px]">
            {formatLong(date)}
          </p>
          <h1 className="text-[34px] font-bold leading-none tracking-display lg:text-[44px]">
            {date === todayString() ? "Today" : "Readings"}
          </h1>
        </div>
        <DateChip value={date} onChange={changeDate} />
      </div>

      <DateStrip date={date} onChange={changeDate} />

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <section
          className={`transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-wide text-muted">
              DAILY LOG
            </h2>
            <span className="text-[13px] font-semibold text-brand">
              {logged} of 4 logged
            </span>
          </div>
          <div className="mb-4 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i
                key={i}
                className={`h-1 flex-1 rounded-sm ${i < logged ? "bg-brand" : "bg-[#E4E2DC]"}`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-3">
              <FormError>{error}</FormError>
            </div>
          )}

          <div className={`${card} overflow-hidden`}>
            {SLOTS.map((s, i) => (
              <SlotRow
                key={s.value}
                slot={s}
                reading={readings.find((r) => r.slot === s.value)}
                active={slot === s.value}
                last={i === SLOTS.length - 1}
                onPick={() => {
                  setSlot(s.value);
                  setSheetOpen(true);
                }}
              />
            ))}
          </div>
        </section>

        <ReadingForm
          date={date}
          slot={slot ?? "morning"}
          onSlot={setSlot}
          readings={readings}
          sheetOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onDone={afterSave}
        />
      </div>
    </>
  );
}
