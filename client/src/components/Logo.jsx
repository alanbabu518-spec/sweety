const STANDARD = [
  "M123 30.2L65.6 102A80 80 0 0 0 48.2 147L123 147Z",
  "M133 30.2L190.4 102A80 80 0 0 1 207.8 147L133 147Z",
  "M123 157L48.2 157A80 80 0 0 0 123 231.8Z",
  "M133 157L207.8 157A80 80 0 0 1 133 231.8Z",
];
const SMALL = [
  "M120 34L65.6 102A80 80 0 0 0 48.4 144L120 144Z",
  "M136 34L190.4 102A80 80 0 0 1 207.6 144L136 144Z",
  "M120 160L48.4 160A80 80 0 0 0 120 231.6Z",
  "M136 160L207.6 160A80 80 0 0 1 136 231.6Z",
];

export default function Logo({ size = 28, className = "" }) {
  const paths = size < 32 ? SMALL : STANDARD;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
