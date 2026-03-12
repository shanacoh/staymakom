/**
 * PriceBreakdown V1 — used by BookingPanel V1 (Experience old route)
 * Minimal stub preserved to maintain backward compatibility
 */
interface PriceBreakdownProps {
  roomPrice: number;
  experiencePrice: number;
  extrasTotal: number;
  totalPrice: number;
  currency: string;
}

const PriceBreakdown = ({ totalPrice, currency }: PriceBreakdownProps) => {
  return (
    <div className="border-t pt-3 space-y-1">
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{currency === "ILS" ? "₪" : "$"}{totalPrice}</span>
      </div>
    </div>
  );
};

export default PriceBreakdown;
