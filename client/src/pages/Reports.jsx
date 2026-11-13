import { useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import { card } from "../ui";
import { todayString } from "../dates";
import DateChip from "../components/DateChip";
import FormError from "../components/FormError";
import ReportCard from "../components/ReportCard";

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "mtd", label: "Month to date" },
  { key: "monthly", label: "Last month" },
];

export default function Reports() {
  const [date, setDate] = useState(todayString());
  const [tab, setTab] = useState("daily");
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    Promise.all([
      api.get("/reports/daily", { params: { date } }),
      api.get("/reports/month-to-date", { params: { date } }),
      api.get("/reports/monthly", { params: { date } }),
    ])
      .then(([daily, mtd, monthly]) => {
        if (ignore) return;
        setReports({
          daily: daily.data.report,
          mtd: mtd.data.report,
          monthly: monthly.data.report,
        });
      })
      .catch((err) => !ignore && setError(errorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [date]);

  // On mobile only the chosen tab shows; from lg: up everything shows.
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
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`press min-h-10 flex-1 rounded-[11px] text-[13px] font-semibold transition-colors ${tab === t.key ? "bg-white text-ink shadow-sm" : "text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <FormError>{error}</FormError>}
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
              {reports.daily.readings.map((r) => (
                <div key={r.id} className="px-6 py-3.5">
                  <div className="mb-2 flex justify-between text-[15px] font-semibold">
                    <span>{r.slotLabel}</span>
                    <span>{r.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-track">
                    <div
                      className="h-1.5 rounded-full bg-brand"
                      style={{
                        width: `${Math.min(100, (r.value / 200) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}
