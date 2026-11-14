import { useEffect, useState } from "react";
import api from "../api";
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
import ErrorPage from "../components/ErrorPage";
import ReadingForm from "../components/ReadingForm";

const firstEmptySlot = (readings) =>
  SLOTS.find((item) => !readings.some((reading) => reading.slot === item.value))
    ?.value ?? "morning";

function DateStrip({ date, onChange }) {
  const today = todayString();

  return (
    <div className="mb-6 flex gap-1.5 lg:hidden">
      {weekDays(date).map((day) => {
        const active = day === date;

        return (
          <button
            key={day}
            type="button"
            aria-pressed={active}
            aria-label={formatLong(day)}
            disabled={day > today}
            onClick={() => onChange(day)}
            className={`press flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-base font-semibold disabled:cursor-not-allowed ${
              active
                ? "bg-ink text-white"
                : day > today
                  ? "text-faint"
                  : "text-ink"
            }`}
          >
            <span
              className={`text-[11px] font-medium ${
                active ? "text-white/70" : "text-muted"
              }`}
            >
              {weekdayShort(day)}
            </span>

            {dayNumber(day)}
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

function DaySummary({ readings }) {
  const values = readings.map((reading) => reading.value);

  const logged = new Set(readings.map((reading) => reading.slot));

  const average = values.length
    ? (
        values.reduce((total, value) => total + value, 0) / values.length
      ).toFixed(1)
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
      className={`press flex min-h-[72px] w-full items-center gap-3.5 px-5 text-left lg:min-h-20 lg:px-7 ${
        last ? "" : "border-b border-ink/5"
      } ${active ? "lg:bg-chip/60" : ""}`}
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
        className={`flex-1 text-base font-semibold ${
          reading ? "" : "text-muted"
        }`}
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
  const [loadErrorState, setLoadErrorState] = useState(null);
  const [slot, setSlot] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loadedRequest, setLoadedRequest] = useState(null);

  const requestKey = `${date}-${attempt}`;

  const loading = loadedRequest !== requestKey;

  const loadError =
    loadErrorState?.key === requestKey ? loadErrorState.error : null;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReadings() {
      try {
        const { data } = await api.get("/readings", {
          params: { date },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setReadings(data.readings);
        setLoadErrorState(null);
      } catch (err) {
        if (controller.signal.aborted) return;

        setLoadErrorState({
          key: requestKey,
          error: err,
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoadedRequest(requestKey);
        }
      }
    }

    fetchReadings();

    return () => {
      controller.abort();
    };
  }, [date, attempt, requestKey]);

  const selectedSlot =
    slot ?? (!loading ? firstEmptySlot(readings) : "morning");

  const changeDate = (nextDate) => {
    setSlot(null);
    setSheetOpen(false);
    setDate(nextDate);
  };

  const afterSave = () => {
    setSheetOpen(false);
    setSlot(null);
    setAttempt((current) => current + 1);
  };

  const logged = SLOTS.filter((item) =>
    readings.some((reading) => reading.slot === item.value),
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

          <DateChip value={date} max={today} onChange={changeDate} />

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
          className={`space-y-6 transition-opacity ${
            loading ? "opacity-60" : ""
          }`}
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
              {[0, 1, 2, 3].map((index) => (
                <i
                  key={index}
                  className={`h-1 flex-1 rounded-sm ${
                    index < logged ? "bg-brand" : "bg-[#E4E2DC]"
                  }`}
                />
              ))}
            </div>

            {loadError ? (
              <ErrorPage
                variant="inline"
                error={loadError}
                onRetry={() => setAttempt((current) => current + 1)}
              />
            ) : (
              <div className={`${card} overflow-hidden`}>
                {SLOTS.map((item, index) => (
                  <SlotRow
                    key={item.value}
                    slot={item}
                    reading={readings.find(
                      (reading) => reading.slot === item.value,
                    )}
                    active={selectedSlot === item.value}
                    last={index === SLOTS.length - 1}
                    onPick={() => {
                      setSlot(item.value);
                      setSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <ReadingForm
          key={`${date}-${selectedSlot}`}
          date={date}
          slot={selectedSlot}
          onSlot={setSlot}
          readings={readings}
          sheetOpen={sheetOpen}
          disabled={loading || !!loadError}
          onClose={() => setSheetOpen(false)}
          onDone={afterSave}
        />
      </div>
    </>
  );
}
