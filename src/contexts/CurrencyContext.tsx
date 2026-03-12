import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackCurrencySwitched } from "@/lib/analytics";

type DisplayCurrency = "ILS" | "USD";

interface CurrencyContextValue {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
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

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyRaw] = useState<DisplayCurrency>("USD");

  const setDisplayCurrency = useCallback((c: DisplayCurrency) => {
    setDisplayCurrencyRaw((prev) => {
      if (prev !== c) trackCurrencySwitched(prev, c);
      return c;
    });
  }, []);

  // Fetch live ILS→USD rate, cache for the session
  const { data: rate } = useQuery<number>({
    queryKey: ["ils-usd-rate"],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.frankfurter.dev/v1/latest?from=ILS&to=USD");
        if (!res.ok) throw new Error("rate fetch failed");
        const json = await res.json();
        return json?.rates?.USD ?? FALLBACK_ILS_TO_USD;
      } catch {
        return FALLBACK_ILS_TO_USD;
      }
    },
    staleTime: Infinity, // cache for entire session
    gcTime: Infinity,
    retry: 1,
  });

  const ilsToUsd = rate ?? FALLBACK_ILS_TO_USD;

  const convert = useCallback(
    (amountILS: number) => {
      if (displayCurrency === "ILS") return amountILS;
      return amountILS * ilsToUsd;
    },
    [displayCurrency, ilsToUsd],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      convert,
      symbol: displayCurrency === "ILS" ? "₪" : "$",
      altSymbol: displayCurrency === "ILS" ? "$" : "₪",
      altCode: displayCurrency === "ILS" ? "USD" : "NIS",
      ilsToUsd,
    }),
    [displayCurrency, convert, ilsToUsd],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
