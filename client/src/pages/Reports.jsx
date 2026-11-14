import { useEffect, useState } from "react";
import api from "../api";
import { card } from "../ui";
import { todayString } from "../dates";
import DateChip from "../components/DateChip";
import ErrorPage from "../components/ErrorPage";
import GlucoseTrendChart from "../components/GlucoseTrendChart";
import ReportCard from "../components/ReportCard";

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "mtd", label: "Month to date" },
  { key: "monthly", label: "Last month" },
];

export default function Reports() {
  const [date, setDate] = useState(todayString());
  const [tab, setTab] = useState("daily");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const requestKey = `${date}-${attempt}`;

  const reports = result?.key === requestKey ? result.data.reports : null;

  const readings = result?.key === requestKey ? result.data.readings : [];

  const error = errorState?.key === requestKey ? errorState.error : null;

  const loading = !reports && !error;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReports() {
      try {
        const config = {
          params: { date },
          signal: controller.signal,
        };

        const [daily, mtd, monthly, allReadings] = await Promise.all([
          api.get("/reports/daily", config),
          api.get("/reports/month-to-date", config),
          api.get("/reports/monthly", config),
          api.get("/readings", {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        setResult({
          key: requestKey,
          data: {
            reports: {
              daily: daily.data.report,
              mtd: mtd.data.report,
              monthly: monthly.data.report,
            },
            readings: allReadings.data.readings,
          },
        });

        setErrorState(null);
      } catch (err) {
        if (controller.signal.aborted) return;

        setErrorState({
          key: requestKey,
          error: err,
        });
      }
    }

    fetchReports();

    return () => {
      controller.abort();
    };
  }, [date, attempt, requestKey]);

  const show = (key) => (tab === key ? "block" : "hidden lg:block");

  return (
    <>
      <div className="mb-6 flex items-end justify-between lg:mb-8">
        <h1 className="text-[34px] font-bold leading-none tracking-display lg:text-[44px]">
          Reports
        </h1>

        <DateChip value={date} onChange={setDate} />
      </div>

      <div
        role="tablist"
        aria-label="Report period"
        className="mb-5 flex rounded-[14px] bg-track p-[3px] lg:hidden"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`press min-h-10 flex-1 rounded-[11px] text-[13px] font-semibold transition-colors ${
              tab === item.key ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <ErrorPage
          variant="inline"
          error={error}
          onRetry={() => setAttempt((current) => current + 1)}
        />
      )}

      {!reports && loading && <p className="text-muted">Loading…</p>}

      {reports && (
        <div className={`transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-6 lg:grid-cols-3">
            <ReportCard
              title="DAILY"
              dark
              report={reports.daily}
              className={show("daily")}
            />

            <ReportCard
              title="MONTH TO DATE"
              report={reports.mtd}
              className={show("mtd")}
            />

            <ReportCard
              title="PREVIOUS MONTH"
              report={reports.monthly}
              className={show("monthly")}
            />
          </div>

          {reports.daily.readings.length > 0 && (
            <section className={`${card} mt-6 py-3 ${show("daily")}`}>
              <h2 className="px-6 pb-2 pt-3 text-[13px] font-semibold tracking-wide text-muted">
                DAILY READINGS
              </h2>

              {reports.daily.readings.map((reading) => (
                <div key={reading.id} className="px-6 py-3.5">
                  <div className="mb-2 flex justify-between text-[15px] font-semibold">
                    <span>{reading.slotLabel}</span>
                    <span>{reading.value}</span>
                  </div>

                  <div className="h-1.5 rounded-full bg-track">
                    <div
                      className="h-1.5 rounded-full bg-brand"
                      style={{
                        width: `${Math.min(100, (reading.value / 200) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          <GlucoseTrendChart readings={readings} month={date.slice(0, 7)} />
        </div>
      )}
    </>
  );
}
