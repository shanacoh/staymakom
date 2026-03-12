/**
 * HyperGuest Tax & Fee Breakdown Utility
 * Separates "display" taxes (paid at hotel) from "included" taxes (in price)
 */

export interface TaxFeeItem {
  description?: string;
  name?: string;
  amount: number;
  currency: string;
  relation?: string;
}

export interface TaxBreakdown {
  displayTaxes: TaxFeeItem[];
  includedTaxes: TaxFeeItem[];
  displayFees: TaxFeeItem[];
  includedFees: TaxFeeItem[];
  totalDisplayAmount: number;
  totalIncludedAmount: number;
  currency: string;
}

/**
 * Extract tax breakdown from a raw rate plan object (as used in RoomOptionsV2)
 */
export function extractTaxBreakdown(ratePlan: any): TaxBreakdown {
  const sellTaxes: TaxFeeItem[] = (ratePlan?.prices?.sell?.taxes || []).map((t: any) => ({
    description: t.description || t.name || 'Tax',
    amount: Number(t.amount || 0),
    currency: t.currency || ratePlan?.prices?.sell?.currency || 'ILS',
    relation: t.relation,
  }));

  const fees: TaxFeeItem[] = (ratePlan?.prices?.fees || []).map((f: any) => ({
    description: f.description || f.name || 'Fee',
    amount: Number(f.amount || 0),
    currency: f.currency || ratePlan?.prices?.sell?.currency || 'ILS',
    relation: f.relation,
  }));

  const currency = ratePlan?.prices?.sell?.currency || 'ILS';

  const displayTaxes = sellTaxes.filter(t => t.relation === 'display');
  const includedTaxes = sellTaxes.filter(t => t.relation === 'included');
  const displayFees = fees.filter(f => f.relation === 'display');
  const includedFees = fees.filter(f => f.relation === 'included');

  const totalDisplayAmount = [...displayTaxes, ...displayFees].reduce((sum, t) => sum + t.amount, 0);
  const totalIncludedAmount = [...includedTaxes, ...includedFees].reduce((sum, t) => sum + t.amount, 0);

  return {
    displayTaxes,
    includedTaxes,
    displayFees,
    includedFees,
    totalDisplayAmount,
    totalIncludedAmount,
    currency,
  };
}

/**
 * Format a currency amount
 */
export function formatTaxAmount(amount: number, currency: string): string {
  const symbol = currency === 'ILS' ? '₪' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  return `${symbol}${amount.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
