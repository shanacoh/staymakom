/**
 * Pop-up affiché quand un visiteur clique sur "Réserver" depuis la page vitrine
 * (démonstration avant lancement officiel) — la réservation n'est pas encore ouverte.
 */
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import { uiGroup } from "@/lib/translations";

interface VitrineBookingBlockedDialogProps {
  open: boolean;
  onClose: () => void;
  lang?: "en" | "he" | "fr";
}


export default function VitrineBookingBlockedDialog({ open, onClose, lang = "en" }: VitrineBookingBlockedDialogProps) {
  const navigate = useNavigate();
  const t = uiGroup("vitrineBookingBlockedDialogTranslations");

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
