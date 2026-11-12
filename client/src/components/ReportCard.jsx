import { formatRange } from "../dates";

export default function ReportCard({ title, report, children }) {
  const { stats, range } = report;

  return (
    <section className="card">
      <div className="report-head">
        <h2>{title}</h2>
        <span className="muted">{formatRange(range)}</span>
      </div>

      {stats.count === 0 ? (
        <p className="empty">No readings in this period yet.</p>
      ) : (
        <div className="stats">
          <div className="stat">
            <span>Highest</span>
            <strong>{stats.highest}</strong>
          </div>
          <div className="stat">
            <span>Lowest</span>
            <strong>{stats.lowest}</strong>
          </div>
          <div className="stat">
            <span>Average</span>
            <strong>{stats.average.toFixed(1)}</strong>
          </div>
          <div className="stat">
            <span>Readings</span>
            <strong>{stats.count}</strong>
          </div>
        </div>
      )}

      {children}
    </section>
  );
}
