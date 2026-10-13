// Choix de photos à proposer. Elles sont envoyées dans le dossier du prestataire et ne paraissent
// nulle part sur le site tant que la proposition n'est pas acceptée.

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { QuietButton } from "@/components/partner/ui";
import { PARTNER_PHOTO_MAX_BYTES, uploadPartnerPhoto } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";

const MAX_PHOTOS = 12;

export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const { t } = usePartner();
  const { provider } = usePartnerSession();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const add = async (files: FileList | null) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/")).slice(0, MAX_PHOTOS - photos.length);
    if (images.length === 0) return;
    if (images.some((file) => file.size > PARTNER_PHOTO_MAX_BYTES)) {
      toast.error(t.pPhotosTooBig);
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of images) uploaded.push(await uploadPartnerPhoto(provider.id, file));
      onChange([...photos, ...uploaded]);
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url) => (
            <li key={url} className="relative aspect-[5/4] overflow-hidden rounded-[10px] bg-neutral-100">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((p) => p !== url))}
                aria-label={t.cancel}
                className="absolute end-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      <QuietButton busy={uploading} disabled={photos.length >= MAX_PHOTOS} onClick={() => input.current?.click()}>
        {!uploading && <ImagePlus className="h-4 w-4" aria-hidden />}
        {uploading ? t.pPhotosUploading : t.pPhotosAdd}
      </QuietButton>
    </div>
  );
}
