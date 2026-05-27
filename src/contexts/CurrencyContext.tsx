import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackCurrencySwitched } from "@/lib/analytics";

type DisplayCurrency = "ILS" | "USD" | "EUR";

const CURRENCY_CYCLE: DisplayCurrency[] = ["ILS", "USD", "EUR"];

interface CurrencyContextValue {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  /** Cycle to the next currency in the sequence: ILS → USD → EUR → ILS */
  cycleCurrency: () => void;
  /** Convert an amount from ILS to the current display currency */
  convert: (amountILS: number) => number;
  /** Currency symbol for the active display currency */
  symbol: string;
  /** The other currency symbol (for toggle labels) */
  altSymbol: string;
  altCode: string;
  ilsToUsd: number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const FALLBACK_ILS_TO_USD = 0.27;
const FALLBACK_ILS_TO_EUR = 0.25;

interface Rates { USD: number; EUR: number }

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyRaw] = useState<DisplayCurrency>(() => {
    try {
      const saved = localStorage.getItem("staymakom_currency");
      if (saved === "ILS" || saved === "USD" || saved === "EUR") return saved;
    } catch {}
    return "USD";
  });

  const setDisplayCurrency = useCallback((c: DisplayCurrency) => {
    setDisplayCurrencyRaw((prev) => {
      if (prev !== c) {
        trackCurrencySwitched(prev, c);
        try { localStorage.setItem("staymakom_currency", c); } catch {}
      }
      return c;
    });
  }, []);

  const cycleCurrency = useCallback(() => {
    setDisplayCurrencyRaw((prev) => {
      const idx = CURRENCY_CYCLE.indexOf(prev);
      const next = CURRENCY_CYCLE[(idx + 1) % CURRENCY_CYCLE.length];
      trackCurrencySwitched(prev, next);
      try { localStorage.setItem("staymakom_currency", next); } catch {}
      return next;
    });
  }, []);

  // Fetch live ILS→USD and ILS→EUR rates in one call, cache for the session
  const { data: rates } = useQuery<Rates>({
    queryKey: ["ils-rates"],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.frankfurter.dev/v1/latest?from=ILS&to=USD,EUR");
        if (!res.ok) throw new Error("rate fetch failed");
        const json = await res.json();
        return {
          USD: json?.rates?.USD ?? FALLBACK_ILS_TO_USD,
          EUR: json?.rates?.EUR ?? FALLBACK_ILS_TO_EUR,
        };
      } catch {
        return { USD: FALLBACK_ILS_TO_USD, EUR: FALLBACK_ILS_TO_EUR };
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const ilsToUsd = rates?.USD ?? FALLBACK_ILS_TO_USD;
  const ilsToEur = rates?.EUR ?? FALLBACK_ILS_TO_EUR;

  const convert = useCallback(
    (amountILS: number) => {
      if (displayCurrency === "ILS") return amountILS;
      if (displayCurrency === "EUR") return amountILS * ilsToEur;
      return amountILS * ilsToUsd;
    },
    [displayCurrency, ilsToUsd, ilsToEur],
  );

  const SYMBOLS: Record<DisplayCurrency, string> = { ILS: "₪", USD: "$", EUR: "€" };

  const value = useMemo<CurrencyContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      cycleCurrency,
      convert,
      symbol: SYMBOLS[displayCurrency],
      altSymbol: displayCurrency === "ILS" ? "$" : "₪",
      altCode: displayCurrency === "ILS" ? "USD" : displayCurrency === "EUR" ? "EUR" : "NIS",
      ilsToUsd,
    }),
    [displayCurrency, convert, cycleCurrency, ilsToUsd],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
