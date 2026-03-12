/**
 * Booking Confirmation Dialog — Shown after successful HyperGuest booking
 * ✅ #2c: Display taxes at hotel
 * ✅ #3c: On-request status handling
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, Hotel, Users, MessageSquare, Copy, Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { DualPrice } from "@/components/ui/DualPrice";
import { getBoardTypeLabel } from "@/services/hyperguest";
import { toast } from "sonner";

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
}

interface BookingConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  data: BookingConfirmationData | null;
  lang?: "en" | "he" | "fr";
}

const translations = {
  en: {
    confirmed: "Booking Confirmed!",
    confirmedSub: "Your experience has been booked successfully.",
    pending: "Booking Submitted",
    pendingSub: "Your booking is subject to hotel confirmation. You will be notified of the status.",
    ref: "Reference",
    hgRef: "Confirmation #",
    hotel: "Hotel",
    room: "Room",
    board: "Board",
    dates: "Dates",
    guests: "Guests",
    price: "Total price",
    remarks: "Important notices",
    specialRequests: "Your special requests",
    close: "Close",
    copyRef: "Copy reference",
    nights: "nights",
    taxesAtHotel: "To pay at the hotel (taxes & fees)",
    vatNote: "Prices do not include VAT. Israeli residents are subject to 18% VAT payable at the hotel.",
    viewConfirmation: "View my confirmation",
  },
  he: {
    confirmed: "!ההזמנה אושרה",
    confirmedSub: "החוויה שלך הוזמנה בהצלחה.",
    pending: "ההזמנה נשלחה",
    pendingSub: "הזמנה זו כפופה לאישור המלון. תקבל/י עדכון על הסטטוס.",
    ref: "מספר הפניה",
    hgRef: "מספר אישור",
    hotel: "מלון",
    room: "חדר",
    board: "ארוחות",
    dates: "תאריכים",
    guests: "אורחים",
    price: "מחיר כולל",
    remarks: "הערות חשובות",
    specialRequests: "הבקשות המיוחדות שלך",
    close: "סגור",
    copyRef: "העתק מספר הפניה",
    nights: "לילות",
    taxesAtHotel: "לתשלום במלון (מסים ועמלות)",
    vatNote: "המחירים אינם כוללים מע\"מ. תושבי ישראל חייבים ב-18% מע\"מ המשולם ישירות במלון.",
    viewConfirmation: "צפה באישור שלי",
  },
  fr: {
    confirmed: "Réservation confirmée !",
    confirmedSub: "Votre expérience a été réservée avec succès.",
    pending: "Réservation soumise",
    pendingSub: "Cette réservation est soumise à confirmation par l'hôtel. Vous serez notifié du statut.",
    ref: "Référence",
    hgRef: "N° de confirmation",
    hotel: "Hôtel",
    room: "Chambre",
    board: "Pension",
    dates: "Dates",
    guests: "Voyageurs",
    price: "Prix total",
    remarks: "Remarques importantes",
    specialRequests: "Vos demandes spéciales",
    close: "Fermer",
    copyRef: "Copier la référence",
    nights: "nuits",
    taxesAtHotel: "À régler sur place (taxes et frais)",
    vatNote: "Les prix n'incluent pas la TVA. Les résidents israéliens sont soumis à 18% de TVA payable à l'hôtel.",
    viewConfirmation: "Voir ma confirmation",
  },
};

function fmt(amount: number, _currency: string): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BookingConfirmationDialog({ open, onClose, data, lang = "en" }: BookingConfirmationDialogProps) {
  const t = translations[lang];
  const navigate = useNavigate();
  const { lang: currentLang } = useLanguage();

  if (!data) return null;

  // ✅ #3c: Determine if confirmed or on-request
  const isConfirmed = data.status?.toLowerCase() === "confirmed";
  const isOnRequest = data.isOnRequest || (!isConfirmed && data.status?.toLowerCase() !== "confirmed");

  const copyRef = () => {
    navigator.clipboard.writeText(data.staymakomRef);
    toast.success(lang === "he" ? "הועתק!" : lang === "fr" ? "Copié !" : "Copied!");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isConfirmed ? 'bg-green-100' : 'bg-blue-100'}`}>
              {isConfirmed ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600" />
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.ref}</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-medium">{data.staymakomRef}</span>
                <button onClick={copyRef} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
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

          {/* Price */}
          <div className="flex justify-between items-center">
            <span className="font-medium">{t.price}</span>
            <DualPrice amount={data.sellPrice} currency={data.currency} className="text-primary text-lg items-end" />
          </div>

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
          {data.remarks.filter(r => !/general message that should be shown/i.test(r)).length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5 p-3 rounded-md bg-amber-50 border border-amber-200">
                {data.remarks.filter(r => !/general message that should be shown/i.test(r)).map((remark, idx) => (
                  <p key={idx} className="text-xs text-amber-700">{remark}</p>
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
            {lang === "he" ? "ההזמנות שלי" : lang === "fr" ? "Mes réservations" : "My Bookings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
