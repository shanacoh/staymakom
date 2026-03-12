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
          <DialogTitle>Stay in the loop?</DialogTitle>
          <DialogDescription>
            Would you like to receive occasional emails about new experiences, special offers, and travel tips?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => { onConfirm(false); onOpenChange(false); }}>
            No thanks
          </Button>
          <Button onClick={() => { onConfirm(true); onOpenChange(false); }}>
            Yes, keep me updated
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
