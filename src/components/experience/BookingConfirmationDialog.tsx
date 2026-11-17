/**
 * Booking Confirmation Dialog — Shown after successful HyperGuest booking
 * ✅ #2c: Display taxes at hotel
 * ✅ #3c: On-request status handling
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, Hotel, Users, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { DualPrice } from "@/components/ui/DualPrice";
import { getBoardTypeLabel } from "@/services/hyperguest";
import { tPage, uiGroup } from "@/lib/translations";

export interface BookingConfirmationData {
  hgBookingId: string;
  confirmationNumber?: string;
  status: string;
  hotelName: string;
  roomName: string;
  boardType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  partySize: number;
  /** Montant effectivement payé par le client (déjà déduit de la carte cadeau si applicable). */
  sellPrice: number;
  currency: string;
  remarks: string[];
  specialRequests: string;
  experienceTitle: string;
  staymakomRef: string;
  /** ✅ #2c: Display taxes payable at hotel */
  displayTaxesTotal?: number;
  /** ✅ #3c: Whether booking is on-request */
  isOnRequest?: boolean;
  /** Confirmation token for dedicated page */
  confirmationToken?: string;
  /**
   * Total avant déduction carte cadeau et/ou code promo. Si fourni ET supérieur à
   * `sellPrice`, le total original est affiché barré au-dessus de la ligne "À payer".
   */
  originalTotal?: number;
  /** Montant déduit par la carte cadeau (pour la ligne dédiée). */
  giftCardDiscount?: number;
  /** Montant déduit par un code promo (pour la ligne dédiée, cumulable avec gift card). */
  promoDiscount?: number;
  /** Code promo utilisé, affiché à côté du label. */
  promoCode?: string;
}

interface BookingConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  data: BookingConfirmationData | null;
  lang?: "en" | "he" | "fr";
}


function fmt(amount: number, _currency: string): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BookingConfirmationDialog({ open, onClose, data, lang = "en" }: BookingConfirmationDialogProps) {
  const t = uiGroup("bookingConfirmationDialogTranslations");
  const navigate = useNavigate();
  // Langue réelle de la page : la page de confirmation reste en es / ru / de si c'était le cas.
  const { locale: currentLang } = useLanguage();

  if (!data) return null;

  // ✅ #3c: Determine if confirmed or on-request
  const isConfirmed = data.status?.toLowerCase() === "confirmed";
  const isOnRequest = data.isOnRequest || (!isConfirmed && data.status?.toLowerCase() !== "confirmed");

  const isVatRemark = (r: string) => /taxes are not included|prices do not include vat|17% vat|18% vat|b2 visa|local regulations.*tax|pay.*tax.*check.?in/i.test(r);
  const displayRemarks = data.remarks.filter(r => !/general message that should be shown/i.test(r) && !isVatRemark(r));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isConfirmed ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isConfirmed ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isConfirmed ? t.confirmed : t.pending}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {isConfirmed ? t.confirmedSub : t.pendingSub}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Experience name */}
          <p className="font-semibold text-base">{data.experienceTitle}</p>

          {/* References */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            {data.hgBookingId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.hgRef}</span>
                <span className="font-mono text-xs">{data.hgBookingId}</span>
              </div>
            )}
            <Badge variant={isConfirmed ? "default" : "secondary"} className="text-xs">
              {isConfirmed ? (
                <><Check className="h-3 w-3 mr-1" />{data.status}</>
              ) : (
                <><Clock className="h-3 w-3 mr-1" />{data.status}</>
              )}
            </Badge>
          </div>

          <Separator />

          {/* Hotel & Room details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Hotel className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{data.hotelName}</span>
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              <p>{t.room}: {data.roomName}</p>
              <p>{t.board}: {getBoardTypeLabel(data.boardType)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{data.checkIn} → {data.checkOut} ({data.nights} {t.nights})</span>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{data.partySize} {t.guests}</span>
          </div>

          <Separator />

          {/* Price — affichage adaptatif si réduction(s) appliquée(s) :
              - Sans réduction : juste le total
              - Avec réduction(s) : total original barré + ligne(s) promo et/ou gift card
                + montant payé mis en avant. Cumulable (validé Shana 2026-05-07). */}
          {((data.giftCardDiscount && data.giftCardDiscount > 0) || (data.promoDiscount && data.promoDiscount > 0))
            && data.originalTotal && data.originalTotal > data.sellPrice ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{t.price}</span>
                <span className="line-through">
                  <DualPrice amount={data.originalTotal} currency={data.currency} className="items-end" />
                </span>
              </div>
              {data.promoDiscount && data.promoDiscount > 0 ? (
                <div className="flex justify-between items-center text-sm text-emerald-700 dark:text-emerald-400">
                  <span>
                    {t.promoLabel}
                    {data.promoCode ? <span className="ml-1 font-mono text-xs">{data.promoCode}</span> : null}
                  </span>
                  <span>−<DualPrice amount={data.promoDiscount} currency={data.currency} className="items-end" /></span>
                </div>
              ) : null}
              {data.giftCardDiscount && data.giftCardDiscount > 0 ? (
                <div className="flex justify-between items-center text-sm text-emerald-700 dark:text-emerald-400">
                  <span>{t.giftCardLabel}</span>
                  <span>−<DualPrice amount={data.giftCardDiscount} currency={data.currency} className="items-end" /></span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium">{t.youPaid}</span>
                <DualPrice amount={data.sellPrice} currency={data.currency} className="text-primary text-lg items-end" />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-medium">{t.price}</span>
              <DualPrice amount={data.sellPrice} currency={data.currency} className="text-primary text-lg items-end" />
            </div>
          )}

          {/* ✅ #2c: Display taxes at hotel */}
          {data.displayTaxesTotal != null && data.displayTaxesTotal > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {t.taxesAtHotel}: {fmt(data.displayTaxesTotal, data.currency)}
              </p>
            </div>
          )}

          {/* VAT note */}
          <p className="text-xs text-muted-foreground">{t.vatNote}</p>

          {/* Remarks */}
          {displayRemarks.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                {displayRemarks.map((remark, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">· {remark}</p>
                ))}
              </div>
            </>
          )}

          {/* Special requests */}
          {data.specialRequests && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {t.specialRequests}
              </div>
              <p className="text-sm text-muted-foreground pl-6">{data.specialRequests}</p>
            </div>
          )}

          {/* View confirmation page button */}
          {data.confirmationToken && (
            <Button
              onClick={() => {
                onClose();
                navigate(`/booking/confirmation/${data.confirmationToken}${currentLang !== "en" ? `?lang=${currentLang}` : ""}`);
              }}
              className="w-full mt-2 bg-primary hover:bg-primary/90"
            >
              {t.viewConfirmation}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              onClose();
              navigate("/account?tab=bookings");
            }}
            className="w-full"
          >
            {tPage("bookingConfirmationDialogMyBookings")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
