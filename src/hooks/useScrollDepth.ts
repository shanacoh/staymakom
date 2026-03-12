import { useEffect, useRef } from "react";
import { trackScrollDepth } from "@/lib/analytics";

/**
 * Track scroll depth at 25%, 50%, 75%, 100% — fires once per threshold per mount.
 */
export function useScrollDepth(pageName: string) {
  const fired = useRef(new Set<number>());

  useEffect(() => {
    fired.current = new Set();

    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      const thresholds = [25, 50, 75, 100] as const;
      for (const t of thresholds) {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t);
          trackScrollDepth(pageName, t);
        }
      }
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [pageName]);
}
