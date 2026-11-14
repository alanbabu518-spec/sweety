import { useEffect, useRef, useState } from "react";
import { errorKind, errorMessage } from "../api";
import { card } from "../ui";
import Logo from "./Logo";
import { DROP_PATHS } from "./logoPaths";

const INK = "#111214";
const MINT = "#5BD1AE";
const AMBER = "#E8A33D";

/* ------------------------------------------------------------------ */
/* Copy. One place defines the wording and the buttons for each error. */
/* primary / secondary: retry | home | back | login                    */
/* ------------------------------------------------------------------ */
const KINDS = {
  notfound: {
    ref: "Error 404",
    title: "This page doesn't exist",
    message:
      "The link may be old or mistyped. Your readings are on the Today page.",
    primary: "home",
    secondary: "back",
  },
  server: {
    ref: "Error 500",
    title: "Something broke on our end",
    message:
      "Your readings are safe. Try again in a moment. If it keeps failing, come back a little later.",
    primary: "retry",
    secondary: "home",
  },
  network: {
    ref: "Network error",
    title: "No connection to the server",
    message:
      "Check your internet connection. We'll try again as soon as you're back online.",
    primary: "retry",
  },
  forbidden: {
    ref: "Error 403",
    title: "This isn't available to your account",
    message: "You're logged in, but you don't have access to this page.",
    primary: "home",
    secondary: "back",
  },
  session: {
    ref: "Error 401",
    title: "You've been logged out",
    message: "Your session ended. Log in again to pick up where you left off.",
    primary: "login",
  },
  ratelimit: {
    ref: "Error 429",
    title: "Too many attempts",
    message: "Wait a few minutes, then try again.",
    primary: "retry",
  },
  generic: {
    ref: "Error",
    title: "That didn't work",
    message: "Try again. If it keeps happening, reload the page.",
    primary: "retry",
    secondary: "home",
  },
};

/* ------------------------------------------------------------------ */
/* Illustration: Sweety's four-piece drop. What happens to the pieces  */
/* tells you what went wrong. Order of DROP_PATHS: TL, TR, BL, BR.     */
/* ------------------------------------------------------------------ */
const still = { t: "none", fill: INK, opacity: 1 };

function pieces(kind) {
  switch (kind) {
    case "notfound": // one piece drifts away, leaving a dashed outline
      return [
        still,
        still,
        still,
        {
          t: "translate(46px, 46px) rotate(16deg)",
          fill: MINT,
          opacity: 1,
          ghost: true,
        },
      ];
    case "server": // two pieces knocked out of line
      return [
        still,
        { t: "translate(14px, -10px) rotate(9deg)", fill: AMBER, opacity: 1 },
        { t: "translate(-9px, 10px) rotate(-7deg)", fill: INK, opacity: 1 },
        still,
      ];
    case "network": // pieces pushed apart, faded: nothing is connected
      return [
        { t: "translate(-18px, -18px)", fill: INK, opacity: 0.45 },
        { t: "translate(18px, -18px)", fill: INK, opacity: 0.45 },
        { t: "translate(-18px, 18px)", fill: INK, opacity: 0.45 },
        { t: "translate(18px, 18px)", fill: INK, opacity: 0.45 },
      ];
    case "ratelimit": // half filled, waiting
      return [
        still,
        still,
        { ...still, opacity: 0.2 },
        { ...still, opacity: 0.2 },
      ];
    default:
      return [still, still, still, still];
  }
}

// Small symbol in the middle of the drop for the errors that are about access.
const BADGES = {
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 7v6M12 16.5v.01" />
      <circle cx="12" cy="12" r="8.5" />
    </>
  ),
};
const BADGE_FOR = {
  session: "lock",
  forbidden: "lock",
  ratelimit: "clock",
  generic: "alert",
};

const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function DropArt({ kind, small }) {
  const [settled, setSettled] = useState(false);
  const reduce = reducedMotion();

  // The one animated moment: the drop appears whole, then the pieces move.
  useEffect(() => {
    const id = setTimeout(() => setSettled(true), reduce ? 0 : 650);
    return () => clearTimeout(id);
  }, [reduce]);

  const badge = BADGE_FOR[kind];

  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden="true"
      className={`w-full overflow-visible ${small ? "max-w-[170px]" : "max-w-[200px] lg:max-w-[360px]"}`}
    >
      {pieces(kind).map((p, i) => (
        <g key={i}>
          {p.ghost && (
            <path
              d={DROP_PATHS[i]}
              fill="none"
              stroke={INK}
              strokeOpacity="0.3"
              strokeWidth="2"
              strokeDasharray="5 6"
            />
          )}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: settled ? p.t : "none",
              opacity: settled ? p.opacity : 1,
              transition: reduce
                ? "none"
                : "transform 1200ms cubic-bezier(0.32,0.72,0,1), opacity 900ms ease",
            }}
          >
            <path
              d={DROP_PATHS[i]}
              fill={p.fill}
              style={{ animationDelay: `${i * 120}ms` }}
              className="animate-quad-in motion-reduce:animate-none"
            />
          </g>
        </g>
      ))}

      {kind === "network" && (
        <circle
          cx="128"
          cy="128"
          r="7"
          fill={AMBER}
          className="animate-pulse motion-reduce:animate-none"
        />
      )}

      {badge && (
        <g>
          <circle
            cx="128"
            cy="128"
            r="34"
            className={small ? "fill-white" : "fill-ground"}
          />
          <g
            transform="translate(104 104) scale(2)"
            fill="none"
            stroke={INK}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {BADGES[badge]}
          </g>
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
const primaryCls =
  "press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-[15px] font-semibold text-white hover:bg-ink/90 disabled:opacity-60";
const secondaryCls =
  "press inline-flex h-12 items-center justify-center rounded-full px-5 text-[15px] font-semibold text-muted hover:text-ink";

const goBack = () =>
  window.history.length > 1
    ? window.history.back()
    : window.location.assign("/");

/**
 * The single error screen for the whole app.
 *
 *   <ErrorPage kind="notfound" />                       explicit kind
 *   <ErrorPage error={axiosError} onRetry={load} />     kind + message worked out from the error
 *
 * variant="page"   full screen (404 for logged-out users, crashes)
 * variant="inline" a card inside the normal page layout (failed data loads)
 */
export default function ErrorPage({
  kind,
  error,
  title,
  message,
  detail,
  onRetry,
  variant = "page",
}) {
  const resolved = kind || (error ? errorKind(error) : "generic");
  const info = KINDS[resolved] || KINDS.generic;
  const page = variant === "page";
  const Heading = page ? "h1" : "h2"; // an app page already has its own <h1>
  const headingRef = useRef(null);
  const [busy, setBusy] = useState(false);

  // Our own wording for most problems. The server's own sentence is used only
  // for other client errors it explained itself (e.g. "Please choose a valid date.").
  const status = error?.response?.status;
  const ownWording = [401, 404, 429].includes(status) || !(status < 500);
  const offline = resolved === "network" && navigator.onLine === false;
  const shownMessage =
    message ||
    (offline
      ? "You appear to be offline. Reconnect to the internet and we'll try again."
      : error && !ownWording && resolved !== "forbidden"
        ? errorMessage(error)
        : info.message);
  const shownTitle = title || info.title;

  // Tab title, and (full-page only) move focus to the heading so screen readers announce it.
  useEffect(() => {
    const previous = document.title;
    document.title = `${shownTitle} | Sweety`;
    if (page) headingRef.current?.focus();
    return () => {
      document.title = previous;
    };
  }, [shownTitle, page]);

  const retry = onRetry || (() => window.location.reload());
  const retryRef = useRef(retry);
  retryRef.current = retry;

  // Offline: try again by ourselves the moment the browser is back online.
  useEffect(() => {
    if (resolved !== "network") return;
    const onOnline = () => retryRef.current();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [resolved]);

  async function doRetry() {
    if (busy) return;
    setBusy(true);
    try {
      await retryRef.current();
    } finally {
      setTimeout(() => setBusy(false), 600); // long enough to be seen
    }
  }

  const button = (action, cls) => {
    if (action === "retry")
      return (
        <button
          type="button"
          onClick={doRetry}
          disabled={busy}
          aria-busy={busy}
          className={cls}
        >
          {busy && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
          )}
          {busy ? "Trying again" : "Try again"}
        </button>
      );
    if (action === "home")
      return (
        <a href="/" className={cls}>
          Go to Today
        </a>
      );
    if (action === "login")
      return (
        <a href="/login" className={cls}>
          Log in
        </a>
      );
    return (
      <button type="button" onClick={goBack} className={cls}>
        Go back
      </button>
    );
  };

  const copy = (
    <div className="min-w-0">
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="max-w-[16ch] text-[38px] font-bold leading-[1.04] tracking-display outline-none lg:text-[56px]"
      >
        {shownTitle}
      </Heading>
      <p className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-muted">
        {shownMessage}
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-x-2 gap-y-1">
        {button(info.primary, primaryCls)}
        {info.secondary && button(info.secondary, secondaryCls)}
      </div>

      {resolved === "network" && (
        <p
          role="status"
          className="mt-6 flex items-center gap-2.5 text-sm font-medium text-muted"
        >
          <span
            className="size-2 animate-pulse rounded-full motion-reduce:animate-none"
            style={{ background: AMBER }}
          />
          Waiting for your connection
        </p>
      )}

      <p className="mt-10 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-faint">
        <span>{info.ref}</span>
        {resolved === "notfound" && (
          <code className="max-w-full truncate rounded-lg bg-chip px-2.5 py-1 font-mono text-xs text-muted">
            {window.location.pathname}
          </code>
        )}
      </p>

      {detail && (
        <details className="mt-4 max-w-xl">
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Technical details
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-chip p-3 text-xs text-muted">
            {detail}
          </pre>
        </details>
      )}
    </div>
  );

  const layout = (small) => (
    <div
      role={page ? undefined : "alert"}
      className="mx-auto grid w-full max-w-[1040px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-20"
    >
      <div className="order-first flex lg:order-last lg:justify-end">
        <DropArt kind={resolved} small={small} />
      </div>
      {copy}
    </div>
  );

  if (page) {
    return (
      <div className="flex min-h-dvh flex-col bg-ground">
        <header className="px-6 pb-2 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] lg:px-12 lg:pt-8">
          <a
            href="/"
            aria-label="Sweety home"
            className="press inline-flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Logo size={24} />
            Sweety
          </a>
        </header>
        <main className="flex flex-1 items-center px-6 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] pt-6 lg:px-12">
          {layout(false)}
        </main>
      </div>
    );
  }

  return (
    <section className={`${card} px-6 py-10 lg:px-14 lg:py-16`}>
      {layout(true)}
    </section>
  );
}
