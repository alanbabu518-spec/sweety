import { useEffect, useState } from "react";
import api, { errorMessage } from "../api";
import ReportCard from "../components/ReportCard";
import { todayString } from "../dates";

export default function Reports() {
  const [date, setDate] = useState(todayString());
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
      .catch((err) => {
        if (!ignore) setError(errorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [date]);

  return (
    <>
      <h1>Reports</h1>

      <label className="date-picker">
        Selected date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {loading && !reports && <p className="muted">Loading…</p>}

      {reports && (
        <>
          <ReportCard title="Daily" report={reports.daily}>
            {reports.daily.readings.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Time slot</th>
                    <th>mg/dl</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.daily.readings.map((r) => (
                    <tr key={r.id}>
                      <td>{r.slotLabel}</td>
                      <td>
                        <strong>{r.value}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ReportCard>

          <ReportCard title="Month-to-date" report={reports.mtd} />
          <ReportCard title="Previous month" report={reports.monthly} />
        </>
      )}
    </>
  );
}
