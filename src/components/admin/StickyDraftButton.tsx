import { Button } from "@/components/ui/button";
import { Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface StickyDraftButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isSaved?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  showPulse?: boolean;
}

export function StickyDraftButton({
  onClick,
  isLoading = false,
  isSaved = false,
  disabled = false,
  className,
  label = "Save Draft",
  showPulse = false,
}: StickyDraftButtonProps) {
  const [showSavedState, setShowSavedState] = useState(false);

  useEffect(() => {
    if (isSaved) {
      setShowSavedState(true);
      const timer = setTimeout(() => setShowSavedState(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "rounded-full shadow-lg px-6 py-3 text-base font-semibold transition-all duration-300",
          showSavedState
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-primary hover:bg-primary-glow text-primary-foreground",
          showPulse && !isLoading && !showSavedState && "animate-pulse"
        )}
      >
        {showSavedState ? (
          <><Check className="h-5 w-5 mr-2" />Saved!</>
        ) : isLoading ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save className="h-5 w-5 mr-2" />{label}</>
        )}
      </Button>
    </div>
  );
}
