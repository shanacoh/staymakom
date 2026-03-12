/**
 * /cart — Shows the user's localStorage-persisted cart.
 * 48-hour TTL. Links back to checkout to continue.
 * Mobile: same layout as Saved / Account auth prompt screens.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ShoppingBag, Trash2, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import { DualPrice } from "@/components/ui/DualPrice";
import type { CheckoutState } from "@/pages/Checkout";

const CART_TTL_MS = 48 * 60 * 60 * 1000;

interface CartData extends CheckoutState {
  savedAt?: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("staymakom_cart");
      if (raw) {
        const parsed: CartData = JSON.parse(raw);
        const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : 0;
        if (Date.now() - savedAt > CART_TTL_MS) {
          localStorage.removeItem("staymakom_cart");
          toast.info("Your saved escape has expired.");
          setCart(null);
        } else {
          setCart(parsed);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  const handleRemove = () => {
    localStorage.removeItem("staymakom_cart");
    setCart(null);
    toast.success("Cart cleared");
  };

  const handleContinue = () => {
    if (!cart) return;
    navigate("/checkout", { state: cart });
  };

  if (!loaded) return null;

  // Empty state — same style as MobileAuthPrompt / Saved
  if (!cart) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Desktop header only */}
        <div className="hidden md:block"><Header /></div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <ShoppingBag size={40} strokeWidth={1.3} className="text-primary mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
            Cart
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            No escape saved yet.
          </p>
          <Button
            variant="outline"
            className="rounded-full px-8 border-primary text-primary hover:bg-primary/5"
            onClick={() => navigate("/launch")}
          >
            <Compass className="h-4 w-4 mr-2" />
            Start exploring
          </Button>
        </div>
      </div>
    );
  }

  // Cart exists
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop header only */}
      <div className="hidden md:block"><Header /></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <ShoppingBag size={40} strokeWidth={1.3} className="text-primary mb-6" />
        <h1 className="text-xl font-semibold text-foreground mb-6 text-center">
          Your saved escape
        </h1>

        <div className="w-full max-w-sm border border-border rounded-xl p-5 space-y-3 bg-card">
          {/* Experience name */}
          <div>
            <h2 className="text-base font-semibold leading-snug">{cart.experienceTitle}</h2>
            {cart.hotelName && (
              <p className="text-sm text-muted-foreground mt-0.5">{cart.hotelName}</p>
            )}
          </div>

          {/* Dates */}
          {cart.dateRange?.from && cart.dateRange?.to && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium">
                {format(parseISO(cart.dateRange.from), "dd MMM")} → {format(parseISO(cart.dateRange.to), "dd MMM")}
                <span className="text-muted-foreground font-normal ml-1">
                  · {cart.nights} {cart.nights === 1 ? "night" : "nights"}
                </span>
              </span>
            </div>
          )}

          {/* Guests */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guests</span>
            <span className="font-medium">
              {cart.adults} {cart.adults === 1 ? "guest" : "guests"}
              {cart.childrenAges?.length > 0 && ` + ${cart.childrenAges.length} children`}
            </span>
          </div>

          {/* Room */}
          {cart.selectedRoomName && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Room</span>
              <span className="font-medium">{cart.selectedRoomName}</span>
            </div>
          )}

          {/* Extras */}
          {cart.selectedExtras && cart.selectedExtras.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Extras</span>
              <ul className="mt-1 space-y-0.5">
                {cart.selectedExtras.map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span>{e.name}</span>
                    <DualPrice amount={e.price} currency={e.currency} inline className="text-sm" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Saved time */}
          {cart.savedAt && (
            <p className="text-xs text-muted-foreground/70 pt-1">
              Saved {formatDistanceToNow(new Date(cart.savedAt), { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="w-full max-w-sm mt-6 space-y-3">
          <Button className="w-full" size="lg" onClick={handleContinue}>
            Continue to booking
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <button
            onClick={handleRemove}
            className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
