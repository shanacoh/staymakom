import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label: string;
  bucket: "experience-images" | "category-images" | "journal-images" | "hotel-images";
  value: string;
  onChange: (url: string) => void;
  className?: string;
  required?: boolean;
  description?: string;
}

export const ImageUpload = ({
  label,
  bucket,
  value,
  onChange,
  className,
  required = false,
  description,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {value ? (
        <div className="relative w-full max-w-md">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border shadow-sm group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-md">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id={`upload-${label}`}
          />
          <label
            htmlFor={`upload-${label}`}
            className={cn(
              "aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted/70 hover:border-muted-foreground/40 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </>
            )}
          </label>
        </div>
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
