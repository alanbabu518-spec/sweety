export default function GlucoseRing({ size = 132, dark = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 132 132"
      role="img"
      aria-label="Glucose ring showing 112 mg/dl"
    >
      <circle
        cx="66"
        cy="66"
        r="56"
        fill="none"
        strokeWidth="10"
        className={dark ? "stroke-[#2A2C31]" : "stroke-[#E4E2DC]"}
      />
      <circle
        cx="66"
        cy="66"
        r="56"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="264 352"
        transform="rotate(-90 66 66)"
        className={dark ? "stroke-mint" : "stroke-brand"}
      />
      <text
        x="66"
        y="70"
        textAnchor="middle"
        className={`text-[34px] font-bold ${dark ? "fill-white" : "fill-ink"}`}
        letterSpacing="-1"
      >
        112
      </text>
      <text
        x="66"
        y="90"
        textAnchor="middle"
        className={`text-xs ${dark ? "fill-white/70" : "fill-muted"}`}
      >
        mg/dl
      </text>
    </svg>
  );
}
