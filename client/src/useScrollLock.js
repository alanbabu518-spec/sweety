import { useEffect } from "react";

let locks = 0;

export default function useScrollLock(active, mobileOnly = false) {
  useEffect(() => {
    if (!active) return;
    if (mobileOnly && !window.matchMedia("(max-width: 1023.98px)").matches)
      return;

    const el = document.documentElement;
    if (locks++ === 0) {
      const gap = window.innerWidth - el.clientWidth; // scrollbar width (0 on phones)
      el.style.overflow = "hidden";
      if (gap > 0) el.style.paddingRight = `${gap}px`;
    }
    return () => {
      if (--locks === 0) {
        el.style.overflow = "";
        el.style.paddingRight = "";
      }
    };
  }, [active, mobileOnly]);
}
