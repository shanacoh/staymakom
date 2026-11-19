/**
 * MarketingOptInDialog — used by MyAccountSection
 * Asks user to opt-in to marketing communications
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { tPage } from "@/lib/translations";

interface MarketingOptInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (accepted: boolean) => void;
}

export default function MarketingOptInDialog({
  open,
  onOpenChange,
  onConfirm,
}: MarketingOptInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tPage("marketingOptIn__title")}</DialogTitle>
          <DialogDescription>
            {tPage("marketingOptIn__text")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => { onConfirm(false); onOpenChange(false); }}>
            {tPage("marketingOptIn__no")}
          </Button>
          <Button onClick={() => { onConfirm(true); onOpenChange(false); }}>
            {tPage("marketingOptIn__yes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
