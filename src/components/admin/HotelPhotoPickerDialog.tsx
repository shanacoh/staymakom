import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, Check, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HotelPhotoPickerDialogProps {
  hotelIds: string[];
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}

interface HotelWithPhotos {
  id: string;
  name: string;
  photos: string[] | null;
  hero_image: string | null;
}

const HotelPhotoPickerDialog = ({
  hotelIds,
  onSelect,
  trigger,
}: HotelPhotoPickerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["hotel-photos-picker", hotelIds],
    queryFn: async () => {
      if (!hotelIds.length) return [];
      const { data, error } = await supabase
        .from("hotels2")
        .select("id, name, photos, hero_image")
        .in("id", hotelIds);
      if (error) throw error;
      return data as HotelWithPhotos[];
    },
    enabled: open && hotelIds.length > 0,
  });

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="w-4 h-4 mr-2" />
            Hotel Gallery
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose from hotel photos</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hotels?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No hotels linked to this experience yet.
          </p>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {hotels.map((hotel) => {
                const allPhotos: string[] = [];
                if (hotel.hero_image) allPhotos.push(hotel.hero_image);
                if (hotel.photos) {
                  hotel.photos.forEach((p) => {
                    if (!allPhotos.includes(p)) allPhotos.push(p);
                  });
                }
                if (!allPhotos.length) return null;

                return (
                  <div key={hotel.id}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {hotel.name}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {allPhotos.map((url, idx) => (
                        <button
                          key={`${hotel.id}-${idx}`}
                          type="button"
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90 ${
                            selected === url
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent"
                          }`}
                          onClick={() => setSelected(url)}
                        >
                          <img
                            src={url}
                            alt={`${hotel.name} photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {selected === url && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setSelected(null);
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selected}>
            Use this photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotelPhotoPickerDialog;
