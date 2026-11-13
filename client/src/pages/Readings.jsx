import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { SLOTS } from "../slots";
import { card } from "../ui";
import {
  addDays,
  dayNumber,
  formatLong,
  todayString,
  weekdayShort,
  weekDays,
} from "../dates";
import DateChip from "../components/DateChip";
import DropProgress from "../components/DropProgress";
import FormError from "../components/FormError";
import ReadingForm from "../components/ReadingForm";

const firstEmptySlot = (readings) =>
  SLOTS.find((s) => !readings.some((r) => r.slot === s.value))?.value ??
  "morning";

function DateStrip({ date, onChange }) {
  const today = todayString();
  return (
    <div className="mb-6 flex gap-1.5 lg:hidden">
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

function ArrowButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="press hidden size-11 place-items-center rounded-full border border-ink/10 bg-white text-lg font-semibold hover:bg-chip disabled:text-faint disabled:opacity-60 lg:grid"
    >
      {children}
    </button>
  );
}

// Desktop-only at-a-glance card: average, highest, lowest and the four-part drop.
function DaySummary({ readings }) {
  const values = readings.map((r) => r.value);
  const logged = new Set(readings.map((r) => r.slot));
  const average = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    : "—";

  return (
    <section className={`${card} hidden items-center gap-8 p-7 lg:flex`}>
      <DropProgress logged={logged} size={112} />
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-semibold tracking-wide text-muted">
          AVERAGE
        </h2>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[56px] font-bold leading-none tracking-[-0.04em]">
            {average}
          </span>
          <span className="text-base font-medium text-muted">mg/dl</span>
        </p>
      </div>
      <dl className="flex gap-8 border-l border-ink/5 pl-8">
        <div>
          <dt className="text-[13px] font-semibold tracking-wide text-muted">
            HIGHEST
          </dt>
          <dd className="mt-1 text-[28px] font-bold tracking-[-0.03em]">
            {values.length ? Math.max(...values) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-semibold tracking-wide text-muted">
            LOWEST
          </dt>
          <dd className="mt-1 text-[28px] font-bold tracking-[-0.03em]">
            {values.length ? Math.min(...values) : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function SlotRow({ slot, reading, active, last, onPick }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`press flex min-h-[72px] w-full items-center gap-3.5 px-5 text-left lg:min-h-20 lg:px-7 ${last ? "" : "border-b border-ink/5"} ${active ? "lg:bg-chip/60" : ""}`}
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
  const today = todayString();

  return (
    <>
      <div className="mb-5 flex items-end justify-between lg:mb-8">
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted lg:mb-2 lg:text-[15px]">
            {formatLong(date)}
          </p>
          <h1 className="text-[34px] font-bold leading-none tracking-display lg:text-[44px]">
            {date === today ? "Today" : "Readings"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ArrowButton
            label="Previous day"
            onClick={() => changeDate(addDays(date, -1))}
          >
            ‹
          </ArrowButton>
          <DateChip value={date} onChange={changeDate} />
          <ArrowButton
            label="Next day"
            disabled={date >= today}
            onClick={() => changeDate(addDays(date, 1))}
          >
            ›
          </ArrowButton>
        </div>
      </div>

      <DateStrip date={date} onChange={changeDate} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div
          className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          <DaySummary readings={readings} />

          <section>
            <div className="mb-2.5 flex items-baseline justify-between">
              <h2 className="text-[13px] font-semibold tracking-wide text-muted">
                DAILY LOG
              </h2>
              <span className="text-[13px] font-semibold text-brand">
                {logged} of 4 logged
              </span>
            </div>
            <div className="mb-4 flex gap-1 lg:hidden" aria-hidden="true">
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
        </div>

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
