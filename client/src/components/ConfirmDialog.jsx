import { useEffect, useRef } from "react";
import useScrollLock from "../useScrollLock";
import useFocusTrap from "../useFocusTrap";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const busyRef = useRef(busy);

  // Always keep the latest values.
  onCancelRef.current = onCancel;
  busyRef.current = busy;

  // Hooks must always execute in the same order.
  useScrollLock(open);
  // Keeps Tab inside the dialog and returns focus to the button that opened it.
  // Must come BEFORE the effect below, which moves focus into the dialog.
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;

    // Focus Cancel by default to prevent accidental deletion.
    cancelRef.current?.focus();

    const onKey = (e) => {
      // Ignore Escape while a delete request is in flight.
      if (e.key === "Escape" && !busyRef.current) {
        onCancelRef.current();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Conditional rendering happens after all hooks.
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
      {/* Background overlay */}
      <div
        onClick={busy ? undefined : onCancel}
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-ink/40 motion-reduce:animate-none"
      />

      {/* Confirmation dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full animate-sheet-in rounded-t-[28px] bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_40px_rgb(17_18_20/0.18)] outline-none motion-reduce:animate-none lg:max-w-sm lg:animate-fade-in lg:rounded-3xl lg:p-7 lg:shadow-float"
      >
        <div className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-[#D6D8DC] lg:hidden" />

        <h2 id="confirm-title" className="text-xl font-bold tracking-tight">
          {title}
        </h2>

        <p
          id="confirm-message"
          className="mt-2 text-[15px] leading-relaxed text-muted"
        >
          {message}
        </p>

        <div className="mt-6 grid gap-2 lg:grid-cols-2 lg:gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="press order-2 flex h-12 items-center justify-center rounded-2xl bg-chip text-[15px] font-semibold text-ink hover:bg-track disabled:opacity-60 lg:order-1"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="press order-1 flex h-12 items-center justify-center rounded-2xl bg-danger text-[15px] font-semibold text-white hover:bg-danger/90 disabled:opacity-60 lg:order-2"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
