import { Link } from "react-router-dom";
import { card } from "../ui";
import { formatRange } from "../dates";

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[13px] font-semibold tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-[28px] font-bold tracking-[-0.03em]">{value}</dd>
    </div>
  );
}

export default function ReportCard({ title, report, className = "" }) {
  const { stats, range } = report;

  return (
    <section className={`${card} p-6 lg:p-7 ${className}`}>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted">
        {title}
      </h2>
      <p className="mb-5 mt-1 text-sm font-medium text-muted">
        {formatRange(range)}
      </p>

      {stats.count === 0 ? (
        <div className="py-6 text-center">
          <p className="font-semibold">No readings in this period yet.</p>
          <p className="mt-1 text-sm text-muted">
            Add one on the{" "}
            <Link to="/" className="font-semibold text-brand hover:underline">
              Today
            </Link>{" "}
            page.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 flex items-baseline gap-2">
            <span className="text-[56px] font-bold leading-none tracking-[-0.04em]">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-base font-medium text-muted">avg mg/dl</span>
          </p>
          <dl className="grid grid-cols-3 gap-3 border-t border-ink/5 pt-5">
            <Stat label="HIGHEST" value={stats.highest} />
            <Stat label="LOWEST" value={stats.lowest} />
            <Stat label="READINGS" value={stats.count} />
          </dl>
        </>
      )}
    </section>
  );
}
