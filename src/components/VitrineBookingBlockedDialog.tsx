/**
 * Pop-up affiché quand un visiteur clique sur "Réserver" depuis la page vitrine
 * (démonstration avant lancement officiel) — la réservation n'est pas encore ouverte.
 */
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

interface VitrineBookingBlockedDialogProps {
  open: boolean;
  onClose: () => void;
  lang?: "en" | "he" | "fr";
}

const translations = {
  en: {
    title: "Booking not available yet",
    description: "This page is a preview of StayMakom before our official launch — booking isn't open here yet. Head back to the main site to explore and book live experiences.",
    cta: "Back to the main site",
  },
  he: {
    title: "ההזמנה עדיין לא זמינה",
    description: "העמוד הזה הוא הדגמה של StayMakom לפני ההשקה הרשמית — ההזמנה עדיין לא פתוחה כאן. חזרו לאתר הראשי כדי לגלות ולהזמין חוויות זמינות.",
    cta: "חזרה לאתר הראשי",
  },
  fr: {
    title: "Réservation indisponible pour le moment",
    description: "Cette page est une démonstration de StayMakom avant notre lancement officiel — la réservation n'est pas encore ouverte ici. Retournez sur le site principal pour découvrir et réserver nos expériences disponibles.",
    cta: "Retour au site",
  },
};

export default function VitrineBookingBlockedDialog({ open, onClose, lang = "en" }: VitrineBookingBlockedDialogProps) {
  const navigate = useNavigate();
  const t = translations[lang];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <Construction className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-lg">{t.title}</DialogTitle>
          <DialogDescription className="text-sm">{t.description}</DialogDescription>
        </DialogHeader>
        <Button
          className="w-full mt-2"
          onClick={() => {
            onClose();
            navigate("/");
          }}
        >
          {t.cta}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
