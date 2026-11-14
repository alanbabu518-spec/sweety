import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "../dates";
import { card } from "../ui";

function buildDailyAverages(readings, month) {
  const totals = new Map();
  for (const reading of readings) {
    if (!reading.date?.startsWith(`${month}-`)) continue;
    const current = totals.get(reading.date) || { total: 0, count: 0 };
    current.total += Number(reading.value);
    current.count += 1;
    totals.set(reading.date, current);
  }
  return [...totals.entries()]
    .map(([date, values]) => ({
      date,
      day: String(Number(date.slice(8))),
      average: Number((values.total / values.count).toFixed(1)),
      count: values.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatMonth(month) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

export default function GlucoseTrendChart({ readings = [], month }) {
  const data = buildDailyAverages(readings, month);
  const monthLabel = formatMonth(month);

  return (
    <section className={`${card} mt-6 p-6 lg:p-7`}>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold">Glucose trend</h2>
        <p className="mt-1 text-sm text-muted">
          Daily average readings for {monthLabel} (mg/dl)
        </p>
      </div>

      {data.length === 0 ? (
        <div className="grid min-h-52 place-items-center text-center">
          <div>
            <p className="font-semibold">No readings for this month yet.</p>
            <p className="mt-1 text-sm text-muted">
              Add readings to see your monthly trend.
            </p>
          </div>
        </div>
      ) : (
        <div
          role="img"
          aria-label={`Line chart showing daily average glucose readings for ${monthLabel}`}
          className="h-[260px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
            >
              <CartesianGrid stroke="#eceae5" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#777b83", fontSize: 12 }}
                minTickGap={16}
                label={{
                  value: "Day of month",
                  position: "insideBottom",
                  offset: -2,
                  fill: "#777b83",
                  fontSize: 11,
                }}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#777b83", fontSize: 12 }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                labelFormatter={(day, payload) =>
                  payload?.[0]?.payload?.date
                    ? formatDate(payload[0].payload.date)
                    : `Day ${day}`
                }
                formatter={(value, _name, item) => [
                  `${Number(value).toFixed(1)} mg/dl`,
                  `Daily average (${item.payload.count} reading${item.payload.count === 1 ? "" : "s"})`,
                ]}
                contentStyle={{
                  border: "1px solid #eceae5",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="average"
                name="Daily average"
                stroke="#0b6b52"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0b6b52", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Each point is the average of all readings recorded on that date.
      </p>
    </section>
  );
}
