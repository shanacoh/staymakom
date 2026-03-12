/**
 * SaveForLaterButton — used by BookingPanel2
 * Allows users to save a booking configuration for later
 */
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

interface SaveForLaterButtonProps {
  experienceId: string;
  checkin?: string;
  checkout?: string;
  partySize?: number;
  roomCode?: string;
  roomName?: string;
  lang?: string;
  variant?: "full" | "icon";
}

export function SaveForLaterButton({
  experienceId,
  checkin,
  checkout,
  partySize,
  roomCode,
  roomName,
  lang = "en",
  variant = "full",
}: SaveForLaterButtonProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error(lang === "he" ? "יש להתחבר תחילה" : "Please log in first");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_carts").insert({
        user_id: user.id,
        experience_id: experienceId,
        checkin,
        checkout,
        party_size: partySize,
        room_code: roomCode,
        room_name: roomName,
      });
      if (error) throw error;
      toast.success(lang === "he" ? "נשמר!" : "Saved for later!");
    } catch {
      toast.error(lang === "he" ? "שגיאה בשמירה" : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving}>
        <Bookmark className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="w-full mt-3"
      onClick={handleSave}
      disabled={saving}
    >
      <Bookmark className="h-4 w-4 mr-2" />
      {lang === "he" ? "שמור לאחר כך" : "Save for later"}
    </Button>
  );
}
