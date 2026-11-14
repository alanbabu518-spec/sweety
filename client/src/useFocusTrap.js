import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// While `active` is true:
//  - Tab / Shift+Tab stay inside the dialog (containerRef),
//  - when it closes, focus goes back to whatever was focused before it opened.
//
// Call this BEFORE any effect that moves focus into the dialog, so the
// "element that opened the dialog" is captured first.
export default function useFocusTrap(active, containerRef) {
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement;

    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const box = containerRef.current;
      if (!box) return;

      const items = [...box.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.getClientRects().length > 0,
      );
      if (items.length === 0) {
        // Nothing focusable (e.g. buttons disabled while saving): keep focus on the dialog.
        e.preventDefault();
        box.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (!box.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (current === first || current === box)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Give focus back, unless that element has since left the page.
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [active, containerRef]);
}
