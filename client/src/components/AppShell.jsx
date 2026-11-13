import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { btnText } from "../ui";
import Logo from "./Logo";
import useScrollLock from "../useScrollLock";

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
const ExitIcon = ({ size = 22 }) => (
  <svg {...icon} width={size} height={size}>
    <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg
    {...icon}
    width="16"
    height="16"
    strokeWidth="2.2"
    className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-9 text-[13px]",
  lg: "size-12 text-base",
};

function Avatar({ name, size = "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white ${AVATAR_SIZES[size]}`}
    >
      {initials(name)}
    </span>
  );
}

// True once the page has scrolled a little (used to fade in the header border).
function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

const desktopTab = ({ isActive }) =>
  `flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
    isActive ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
  }`;

// Desktop: avatar button that opens a small account dropdown.
function DesktopAccount({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="press flex min-h-11 items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 text-sm font-semibold transition-colors hover:bg-ink/5 aria-expanded:bg-ink/5"
      >
        <Avatar name={user.name} />
        <span className="max-w-[140px] truncate">{user.name}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-64 animate-fade-in rounded-2xl border border-ink/5 bg-white p-2 shadow-float motion-reduce:animate-none"
        >
          <div className="px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[13px] text-muted">{user.email}</p>
          </div>
          <div className="border-t border-ink/5 pt-1">
            <button
              role="menuitem"
              onClick={onLogout}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/5"
            >
              <ExitIcon size={18} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile: bottom sheet with account details and Log out.
function AccountSheet({ user, open, onClose, onLogout }) {
  const closeRef = useRef(null);
  useScrollLock(open, true);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-ink/40 motion-reduce:animate-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="relative w-full animate-sheet-in rounded-t-[28px] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_40px_rgb(17_18_20/0.18)] motion-reduce:animate-none"
      >
        <div className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-[#D6D8DC]" />
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight">
              {user.name}
            </p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="press mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-chip text-base font-semibold text-danger"
        >
          <ExitIcon size={20} />
          Log out
        </button>
        <button
          ref={closeRef}
          onClick={onClose}
          className={`${btnText} mt-1 w-full`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const [accountOpen, setAccountOpen] = useState(false);
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  // Remember which way we're navigating (Today = 0, Reports = 1) so pages slide the right way.
  const routeIndex = pathname.startsWith("/reports") ? 1 : 0;
  const route = useRef({ index: routeIndex, dir: "animate-page-right" });
  if (route.current.index !== routeIndex) {
    route.current = {
      index: routeIndex,
      dir:
        routeIndex > route.current.index
          ? "animate-page-right"
          : "animate-page-left",
    };
  }

  // New page = start at the top, instantly (a smooth scroll would fight the slide-in).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  const tabIndex = accountOpen ? 2 : pathname.startsWith("/reports") ? 1 : 0;
  const mobileTab = ({ isActive }) =>
    `press relative flex min-h-11 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${
      isActive && !accountOpen ? "text-ink" : "text-muted"
    }`;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      {/* Desktop header */}
      <header
        className={`glass sticky top-0 z-20 hidden border-b bg-ground/80 transition-colors duration-200 lg:block ${
          scrolled ? "border-ink/10" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-12">
          <Link
            to="/"
            aria-label="Sweety home"
            className="press flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Logo size={22} />
            Sweety
          </Link>
          <nav className="flex flex-1 gap-1" aria-label="Main">
            <NavLink to="/" end className={desktopTab}>
              Today
            </NavLink>
            <NavLink to="/reports" className={desktopTab}>
              Reports
            </NavLink>
          </nav>
          <DesktopAccount user={user} onLogout={logout} />
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-[1200px] px-6 pb-32 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] outline-none lg:px-12 lg:pb-16 lg:pt-12"
      >
        <div
          key={pathname}
          className={`${route.current.dir} motion-reduce:animate-none`}
        >
          {children}
        </div>
      </main>

      {/* Mobile floating tab bar */}
      <nav
        aria-label="Main"
        className="glass fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-20 flex rounded-[28px] border border-white/70 bg-white/70 p-1.5 shadow-float lg:hidden"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-2xl bg-ink/[0.06] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${tabIndex * 100}%)` }}
        />
        <NavLink to="/" end className={mobileTab}>
          <CalendarIcon />
          Today
        </NavLink>
        <NavLink to="/reports" className={mobileTab}>
          <BarsIcon />
          Reports
        </NavLink>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setAccountOpen(true)}
          className={`press relative flex min-h-11 flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${
            accountOpen ? "text-ink" : "text-muted"
          }`}
        >
          <span className="grid h-[22px] place-items-center">
            <Avatar name={user.name} size="sm" />
          </span>
          Account
        </button>
      </nav>

      <AccountSheet
        user={user}
        open={accountOpen}
        onClose={closeAccount}
        onLogout={logout}
      />
    </div>
  );
}
