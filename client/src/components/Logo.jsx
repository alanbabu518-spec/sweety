import { DROP_PATHS } from "./logoPaths";

const SMALL = [
  "M120 34L65.6 102A80 80 0 0 0 48.4 144L120 144Z",
  "M136 34L190.4 102A80 80 0 0 1 207.6 144L136 144Z",
  "M120 160L48.4 160A80 80 0 0 0 120 231.6Z",
  "M136 160L207.6 160A80 80 0 0 1 136 231.6Z",
];

export default function Logo({ size = 28, className = "" }) {
  const paths = size < 32 ? SMALL : DROP_PATHS;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
