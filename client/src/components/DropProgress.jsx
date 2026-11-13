import { DROP_PATHS } from "./Logo";
import { SLOTS } from "../slots";

export default function DropProgress({ logged, size = 112 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      role="img"
      aria-label={`${logged.size} of 4 readings logged`}
    >
      {DROP_PATHS.map((d, i) => (
        <path
          key={d}
          d={d}
          className={`transition-colors duration-500 ${logged.has(SLOTS[i].value) ? "fill-brand" : "fill-track"}`}
        />
      ))}
    </svg>
  );
}
