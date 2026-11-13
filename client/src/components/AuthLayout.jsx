import Logo from "./Logo";
import GlucoseRing from "./GlucoseRing";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink p-16 text-white lg:flex">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Logo size={26} className="text-mint" />
          Sweety
        </span>
        <div>
          <GlucoseRing size={200} dark />
          <h1 className="mt-8 text-[56px] font-bold leading-[1.05] tracking-display">
            Track glucose,
            <br />
            calmly.
          </h1>
          <p className="mt-4 max-w-sm text-lg text-white/70">
            Four readings a day. Clear daily and monthly reports.
          </p>
        </div>
        <span />
      </aside>

      <main className="flex min-h-dvh flex-col px-6 pb-10 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:min-h-0 lg:items-center lg:justify-center lg:p-12">
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col lg:flex-none">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight lg:hidden">
            <Logo size={22} />
            Sweety
          </span>
          <div className="flex-1 lg:hidden" />
          <div className="mt-8 lg:hidden">
            <GlucoseRing />
          </div>
          <h1 className="mt-6 text-[34px] font-bold leading-[1.05] tracking-display lg:mt-0 lg:text-[32px]">
            {title}
          </h1>
          <p className="mb-7 mt-3 text-base text-muted lg:mb-8">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
