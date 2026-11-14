import { formatDate, todayString } from "../dates";

// `max` is the latest date that can be chosen (defaults to today).
export default function DateChip({ value, onChange, max = todayString() }) {
  return (
    <label className="press relative flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-4 text-sm font-semibold">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
      {formatDate(value)}
      <input
        type="date"
        value={value}
        max={max} // the picker greys out and blocks later dates
        aria-label="Choose date"
        onChange={(e) => {
          const picked = e.target.value;
          // `max` can be bypassed by typing into the field, so check again here.
          if (picked && picked <= max) onChange(picked);
        }}
        onClick={(e) => e.currentTarget.showPicker?.()}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}
