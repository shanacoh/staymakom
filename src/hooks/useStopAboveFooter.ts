import { useEffect, type RefObject } from 'react';

const GAP_PX = 16;

/**
 * Keeps a fixed-position element above the page footer: when the footer
 * scrolls into view, the element is pushed up so it never covers it.
 */
export function useStopAboveFooter(ref: RefObject<HTMLElement>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const footers = document.querySelectorAll('footer');
      const footer = footers[footers.length - 1];
      if (!footer) {
        el.style.translate = '';
        return;
      }
      const bottomOffset = parseFloat(getComputedStyle(el).bottom) || 0;
      const footerTop = footer.getBoundingClientRect().top;
      const overlap = window.innerHeight - bottomOffset - footerTop + GAP_PX;
      el.style.translate = overlap > 0 ? `0 -${overlap}px` : '';
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}
