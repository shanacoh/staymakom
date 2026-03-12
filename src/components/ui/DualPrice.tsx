import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface DualPriceProps {
  /** Amount in ILS (the base/charging currency) */
  amount: number;
  /** Source currency — kept for compat but assumed ILS */
  currency?: string;
  className?: string;
  showSecondary?: boolean;
  reverse?: boolean;
  /** Compact inline mode (e.g. for table rows) */
  inline?: boolean;
}

function formatAmount(amount: number, symbol: string): string {
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}

/**
 * Displays a price converted to the user's display currency (USD by default).
 * All input amounts are assumed to be in ILS.
 */
export function DualPrice({
  amount,
  currency: _currency,
  className,
  showSecondary = false,
  reverse = false,
  inline = false,
}: DualPriceProps) {
  const { symbol, convert } = useCurrency();
  const displayAmount = convert(amount);

  return <span className={className}>{formatAmount(displayAmount, symbol)}</span>;
}

/** Small helper for admin: shows "≈ XX €" next to an input */
export function ConvertedHint({
  amount,
  fromCurrency,
  toCurrency,
  className,
}: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  className?: string;
}) {
  const { convert, symbol } = useCurrency();
  if (!amount) return null;
  // For admin, just show the converted value
  const converted = convert(amount);
  return (
    <span className={cn("text-xs text-muted-foreground whitespace-nowrap", className)}>
      ≈ {formatAmount(converted, symbol)}
    </span>
  );
}
