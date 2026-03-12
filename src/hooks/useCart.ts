/**
 * Lightweight hook to check if a localStorage cart exists (for indicators).
 * Re-checks on storage events and on mount.
 */
import { useState, useEffect, useCallback } from "react";

const CART_KEY = "staymakom_cart";
const CART_TTL_MS = 48 * 60 * 60 * 1000;

export function useCartExists() {
  const check = useCallback(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : 0;
      if (Date.now() - savedAt > CART_TTL_MS) {
        localStorage.removeItem(CART_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const [exists, setExists] = useState(check);

  useEffect(() => {
    // Re-check on storage events (cross-tab) and periodically
    const handler = () => setExists(check());
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 5000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [check]);

  return exists;
}
