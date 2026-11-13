import { Link } from "react-router-dom";
import { card } from "../ui";
import { formatRange } from "../dates";

function Stat({ label, value, sub }) {
  return (
    <div>
      <dt
        className={`text-[13px] font-semibold tracking-wide text-muted ${sub}`}
      >
        {label}
      </dt>
      <dd className="mt-1 text-[28px] font-bold tracking-[-0.03em]">{value}</dd>
    </div>
  );
}

export default function ReportCard({
  title,
  report,
  dark = false,
  className = "",
}) {
  const { stats, range } = report;
  const sub = dark ? "lg:text-white/60" : "";

  return (
    <section
      className={`${card} p-6 lg:p-7 ${dark ? "lg:border-ink lg:bg-ink lg:text-white" : ""} ${className}`}
    >
      <h2
        className={`text-[13px] font-semibold tracking-wide text-muted ${sub}`}
      >
        {title}
      </h2>
      <p className={`mb-5 mt-1 text-sm font-medium text-muted ${sub}`}>
        {formatRange(range)}
      </p>

      {stats.count === 0 ? (
        <div className="py-6 text-center">
          <p className="font-semibold">No readings in this period yet.</p>
          <p className={`mt-1 text-sm text-muted ${sub}`}>
            Add one on the{" "}
            <Link
              to="/"
              className={`font-semibold text-brand hover:underline ${dark ? "lg:text-mint" : ""}`}
            >
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
            <span className={`text-base font-medium text-muted ${sub}`}>
              avg mg/dl
            </span>
          </p>
          <dl
            className={`grid grid-cols-3 gap-3 border-t border-ink/5 pt-5 ${dark ? "lg:border-white/10" : ""}`}
          >
            <Stat label="HIGHEST" value={stats.highest} sub={sub} />
            <Stat label="LOWEST" value={stats.lowest} sub={sub} />
            <Stat label="READINGS" value={stats.count} sub={sub} />
          </dl>
        </>
      )}
    </section>
  );
}
