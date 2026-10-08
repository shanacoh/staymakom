import { BOOKING_CHANNELS, type BookingChannelId } from "@/constants/bookingChannels";
import { Label } from "@/components/forms/styled";
import { cn } from "@/lib/utils";

interface Props {
  value: BookingChannelId;
  onChange: (id: BookingChannelId) => void;
  disabled?: boolean;
}

// Canal de réservation en 3 pastilles. « Portail prestataire » n'existe pas encore : grisé, non sélectionnable.
export function BookingChannelPills({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <Label>Canal de réservation · interne, jamais visible du client</Label>
      <div className="flex flex-wrap gap-2">
        {BOOKING_CHANNELS.map((channel) => {
          const selected = value === channel.id;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onChange(channel.id)}
              disabled={disabled || channel.comingSoon}
              aria-pressed={selected}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                channel.comingSoon
                  ? "bg-[#f5f3f0] text-[#b3aea6] border-[#e9e6e1] cursor-not-allowed"
                  : selected
                  ? "bg-[#1a1814] text-white border-[#1a1814]"
                  : "bg-white text-[#1a1814] border-[#e9e6e1] hover:border-[#1a1814]/40",
              )}
            >
              {channel.label}
              {channel.comingSoon && " · bientôt"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
