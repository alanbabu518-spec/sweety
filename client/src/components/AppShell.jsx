import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Logo from "./Logo";

const icon = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};
const CalendarIcon = () => (
  <svg {...icon}>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);
const BarsIcon = () => (
  <svg {...icon}>
    <path d="M6 20V11M12 20V5M18 20v-6" />
  </svg>
);
const ExitIcon = () => (
  <svg {...icon}>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
  </svg>
);

const desktopTab = ({ isActive }) =>
  `flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
    isActive ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
  }`;

const mobileTab = ({ isActive }) =>
  `press flex min-h-11 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold ${
    isActive ? "text-ink" : "text-muted"
  }`;

export default function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh">
      {/* Desktop header */}
      <header className="glass sticky top-0 z-20 hidden border-b border-ink/5 bg-ground/80 lg:block">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-12">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Logo size={22} />
            Sweety
          </span>
          <nav className="flex flex-1 gap-1" aria-label="Main">
            <NavLink to="/" end className={desktopTab}>
              Today
            </NavLink>
            <NavLink to="/reports" className={desktopTab}>
              Reports
            </NavLink>
          </nav>
          <span className="text-sm font-medium text-muted">{user.name}</span>
          <button
            onClick={logout}
            className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 pb-32 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] lg:px-12 lg:pb-16 lg:pt-12">
        {children}
      </main>

      {/* Mobile floating tab bar */}
      <nav
        aria-label="Main"
        className="glass fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-20 flex rounded-[28px] border border-white/70 bg-white/70 p-1.5 shadow-float lg:hidden"
      >
        <NavLink to="/" end className={mobileTab}>
          <CalendarIcon />
          Today
        </NavLink>
        <NavLink to="/reports" className={mobileTab}>
          <BarsIcon />
          Reports
        </NavLink>
        <button
          onClick={logout}
          className="press flex min-h-11 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold text-muted"
        >
          <ExitIcon />
          Log out
        </button>
      </nav>
    </div>
  );
}
