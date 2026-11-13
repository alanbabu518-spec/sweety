import Logo, { DROP_PATHS } from "./Logo";

function DropArt({ className = "" }) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={className}>
      {DROP_PATHS.map((d, i) => (
        <path
          key={d}
          d={d}
          style={{ animationDelay: `${i * 140}ms` }}
          className={`animate-quad-in motion-reduce:animate-none ${i === 0 ? "fill-mint/25" : "fill-white/[0.06]"}`}
        />
      ))}
    </svg>
  );
}

function SampleCard() {
  const rows = [
    ["Morning (fasting)", 108],
    ["After breakfast", 146],
  ];
  return (
    <div
      aria-hidden="true"
      className="mt-12 hidden w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-2 lg:block"
    >
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3 px-4 py-3.5">
          <span className="grid size-7 place-items-center rounded-full bg-mint/20">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5BD1AE"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="flex-1 text-[15px] font-semibold">{label}</span>
          <span className="text-xl font-bold tracking-tight">
            {value}
            <small className="ml-1 text-xs font-medium text-white/60">
              mg/dl
            </small>
          </span>
        </div>
      ))}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="size-7 rounded-full border-[1.5px] border-dashed border-white/30" />
        <span className="flex-1 text-[15px] font-semibold text-white/60">
          After lunch
        </span>
        <span className="rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-mint">
          Add
        </span>
      </div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink lg:grid lg:grid-cols-[1.1fr_1fr] lg:bg-ground">
      <aside className="relative overflow-hidden px-6 pb-12 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] text-white lg:flex lg:flex-col lg:justify-between lg:bg-ink lg:p-16">
        <DropArt className="pointer-events-none absolute -right-8 top-4 size-44 lg:-right-40 lg:top-1/2 lg:size-[720px] lg:-translate-y-1/2" />

        <span className="relative flex items-center gap-2 text-lg font-bold tracking-tight lg:text-xl">
          <Logo size={24} className="text-mint" />
          Sweety
        </span>

        <div className="relative mt-14 lg:mt-0">
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-display lg:text-[64px]">
            Track glucose,
            <br />
            calmly.
          </h1>
          <p className="mt-5 hidden max-w-sm text-lg text-white/70 lg:block">
            Four readings a day. Clear daily and monthly reports.
          </p>
          <SampleCard />
        </div>

        <p className="relative hidden text-sm text-white/50 lg:block">
          Your readings are private to your account.
        </p>
      </aside>

      <main className="flex-1 animate-sheet-in rounded-t-[32px] bg-ground px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-8 motion-reduce:animate-none lg:flex lg:animate-none lg:items-center lg:justify-center lg:rounded-none lg:p-12">
        <div className="mx-auto w-full max-w-[380px]">
          <h2 className="text-[28px] font-bold leading-tight tracking-display lg:text-[32px]">
            {title}
          </h2>
          <p className="mb-7 mt-2 text-base text-muted lg:mb-8">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
