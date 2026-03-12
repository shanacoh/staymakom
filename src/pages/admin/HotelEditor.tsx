import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { HotelExtrasManager } from "@/components/admin/HotelExtrasManager";
import { Link } from "react-router-dom";

interface HotelEditorProps {
  hotelId?: string;
  onClose: () => void;
}

export const HotelEditor = ({ hotelId, onClose }: HotelEditorProps) => {
  const queryClient = useQueryClient();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_he: "",
    region: "",
    region_he: "",
    city: "",
    city_he: "",
    story: "",
    story_he: "",
    hero_image: "",
    photos: [] as string[],
    contact_email: "",
    contact_phone: "",
    status: "draft" as "draft" | "published" | "pending" | "archived",
    // Location fields
    address: "",
    address_he: "",
    latitude: null as number | null,
    longitude: null as number | null,
    // SEO fields
    seo_title_en: "",
    seo_title_he: "",
    seo_title_fr: "",
    meta_description_en: "",
    meta_description_he: "",
    meta_description_fr: "",
    og_title_en: "",
    og_title_he: "",
    og_title_fr: "",
    og_description_en: "",
    og_description_he: "",
    og_description_fr: "",
    og_image: "",
  });

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: async () => {
      if (!hotelId) return null;
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .eq("id", hotelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || "",
        name_he: hotel.name_he || "",
        region: hotel.region || "",
        region_he: hotel.region_he || "",
        city: hotel.city || "",
        city_he: hotel.city_he || "",
        story: hotel.story || "",
        story_he: hotel.story_he || "",
        hero_image: hotel.hero_image || "",
        photos: hotel.photos || [],
        contact_email: hotel.contact_email || "",
        contact_phone: hotel.contact_phone || "",
        status: hotel.status || "draft",
        // Location fields
        address: (hotel as any).address || "",
        address_he: (hotel as any).address_he || "",
        latitude: hotel.latitude || null,
        longitude: hotel.longitude || null,
        // SEO fields
        seo_title_en: hotel.seo_title_en || "",
        seo_title_he: hotel.seo_title_he || "",
        seo_title_fr: hotel.seo_title_fr || "",
        meta_description_en: hotel.meta_description_en || "",
        meta_description_he: hotel.meta_description_he || "",
        meta_description_fr: hotel.meta_description_fr || "",
        og_title_en: hotel.og_title_en || "",
        og_title_he: hotel.og_title_he || "",
        og_title_fr: hotel.og_title_fr || "",
        og_description_en: hotel.og_description_en || "",
        og_description_he: hotel.og_description_he || "",
        og_description_fr: hotel.og_description_fr || "",
        og_image: hotel.og_image || "",
      });
    }
  }, [hotel]);

  const handleGeocode = async () => {
    const addressToGeocode = formData.address || `${formData.name}, ${formData.city}, ${formData.region}`;
    
    if (!addressToGeocode.trim()) {
      toast.error("Please enter an address or hotel name/city/region first");
      return;
    }

    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-hotel", {
        body: { address: addressToGeocode },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFormData({
        ...formData,
        latitude: data.latitude,
        longitude: data.longitude,
        address: formData.address || data.displayName,
      });
      
      toast.success(`Location found: ${data.displayName}`);
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find location. Try a more specific address.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dataWithSlug = {
        ...data,
        slug: hotelId ? hotel?.slug : generateSlug(data.name),
      };
      
      if (hotelId) {
        const { error } = await supabase
          .from("hotels")
          .update(dataWithSlug)
          .eq("id", hotelId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hotels")
          .insert([dataWithSlug]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success(hotelId ? "Hotel updated" : "Hotel created");
      onClose();
    },
    onError: (error) => {
      toast.error("Error saving hotel");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/hotels">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hotels
          </Button>
        </Link>
        <h2 className="text-3xl font-bold">
          {hotelId ? "Edit Hotel" : "New Hotel"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Hotel Details - Bilingual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Fields */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Images & Media Section */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Images & Media</h3>
              <p className="text-sm text-muted-foreground">Upload hero image and gallery photos</p>
              
              <div className="space-y-2">
                <ImageUpload
                  label="Hero Image"
                  bucket="hotel-images"
                  value={formData.hero_image}
                  onChange={(url) => setFormData({ ...formData, hero_image: url })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Gallery Images (up to 8)</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.photos.length} / 8 images
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Display uploaded images */}
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img 
                        src={photo} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newPhotos = formData.photos.filter((_, i) => i !== index);
                          setFormData({ ...formData, photos: newPhotos });
                        }}
                      >
                        <span className="text-xs">×</span>
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add images button - only show if less than 8 */}
                  {formData.photos.length < 8 && (
                    <button
                      type="button"
                      className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          const remainingSlots = 8 - formData.photos.length;
                          const filesToUpload = files.slice(0, remainingSlots);
                          
                          toast.promise(
                            Promise.all(
                              filesToUpload.map(async (file) => {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `${Math.random()}.${fileExt}`;
                                const { error: uploadError } = await supabase.storage
                                  .from('hotel-images')
                                  .upload(fileName, file);
                                
                                if (uploadError) throw uploadError;
                                
                                const { data: { publicUrl } } = supabase.storage
                                  .from('hotel-images')
                                  .getPublicUrl(fileName);
                                
                                return publicUrl;
                              })
                            ).then((urls) => {
                              setFormData({ ...formData, photos: [...formData.photos, ...urls] });
                            }),
                            {
                              loading: `Uploading ${filesToUpload.length} image${filesToUpload.length > 1 ? 's' : ''}...`,
                              success: `${filesToUpload.length} image${filesToUpload.length > 1 ? 's' : ''} uploaded!`,
                              error: 'Failed to upload images',
                            }
                          );
                        };
                        input.click();
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">+</span>
                      </div>
                      <span className="text-sm font-medium">Add images</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Location</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set the hotel address and coordinates for map display
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address (English)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Hotel Street, Ayyelet HaShahar, Israel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_he">כתובת (עברית)</Label>
                  <Input
                    id="address_he"
                    value={formData.address_he}
                    onChange={(e) => setFormData({ ...formData, address_he: e.target.value })}
                    placeholder="כתובת בעברית"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude ?? ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      latitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., 33.0742"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude ?? ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      longitude: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="e.g., 35.5585"
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="w-full"
                  >
                    {isGeocoding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Auto-detect coordinates
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {formData.latitude && formData.longitude && (
                <p className="text-sm text-green-600">
                  ✓ Coordinates set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>

            {/* Bilingual Content - Side by Side */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Bilingual Content</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* English Column */}
                <div className="space-y-4">
                  <div className="bg-muted/30 p-2 rounded">
                    <h4 className="font-medium text-sm">English Version</h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Hotel Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="story">Story</Label>
                    <Textarea
                      id="story"
                      value={formData.story}
                      onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                      rows={6}
                    />
                  </div>
                </div>

                {/* Hebrew Column */}
                <div className="space-y-4">
                  <div className="bg-muted/30 p-2 rounded">
                    <h4 className="font-medium text-sm">Hebrew Version (עברית)</h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name_he">שם המלון</Label>
                    <Input
                      id="name_he"
                      value={formData.name_he}
                      onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                      dir="rtl"
                      className="bg-hebrew-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region_he">אזור</Label>
                    <Input
                      id="region_he"
                      value={formData.region_he}
                      onChange={(e) => setFormData({ ...formData, region_he: e.target.value })}
                      dir="rtl"
                      className="bg-hebrew-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city_he">עיר</Label>
                    <Input
                      id="city_he"
                      value={formData.city_he}
                      onChange={(e) => setFormData({ ...formData, city_he: e.target.value })}
                      dir="rtl"
                      className="bg-hebrew-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="story_he">סיפור</Label>
                    <Textarea
                      id="story_he"
                      value={formData.story_he}
                      onChange={(e) => setFormData({ ...formData, story_he: e.target.value })}
                      rows={6}
                      dir="rtl"
                      className="bg-hebrew-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hotelId ? "Update Hotel" : "Create Hotel"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>SEO Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure SEO metadata for search engines and social media sharing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* English Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">English SEO</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_en">SEO Title</Label>
                  <Input
                    id="seo_title_en"
                    value={formData.seo_title_en}
                    onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                    placeholder="Displayed in browser tab and Google results"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_en">Meta Description</Label>
                  <Textarea
                    id="meta_description_en"
                    value={formData.meta_description_en}
                    onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                    placeholder="Shown in Google search results"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_en">Open Graph Title</Label>
                  <Input
                    id="og_title_en"
                    value={formData.og_title_en}
                    onChange={(e) => setFormData({ ...formData, og_title_en: e.target.value })}
                    placeholder="Title when shared on social media"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_en">Open Graph Description</Label>
                  <Textarea
                    id="og_description_en"
                    value={formData.og_description_en}
                    onChange={(e) => setFormData({ ...formData, og_description_en: e.target.value })}
                    placeholder="Description when shared on social media"
                    rows={3}
                  />
                </div>
              </div>

              {/* Hebrew Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">Hebrew SEO (עברית)</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_he">כותרת SEO</Label>
                  <Input
                    id="seo_title_he"
                    value={formData.seo_title_he}
                    onChange={(e) => setFormData({ ...formData, seo_title_he: e.target.value })}
                    placeholder="כותרת עבור גוגל וכרטיסייה"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_he">תיאור Meta</Label>
                  <Textarea
                    id="meta_description_he"
                    value={formData.meta_description_he}
                    onChange={(e) => setFormData({ ...formData, meta_description_he: e.target.value })}
                    placeholder="תיאור עבור תוצאות גוגל"
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_he">כותרת Open Graph</Label>
                  <Input
                    id="og_title_he"
                    value={formData.og_title_he}
                    onChange={(e) => setFormData({ ...formData, og_title_he: e.target.value })}
                    placeholder="כותרת עבור שיתוף ברשתות חברתיות"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_he">תיאור Open Graph</Label>
                  <Textarea
                    id="og_description_he"
                    value={formData.og_description_he}
                    onChange={(e) => setFormData({ ...formData, og_description_he: e.target.value })}
                    placeholder="תיאור עבור שיתוף ברשתות חברתיות"
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </div>

              {/* French Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">French SEO (Français)</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_fr">Titre SEO</Label>
                  <Input
                    id="seo_title_fr"
                    value={formData.seo_title_fr}
                    onChange={(e) => setFormData({ ...formData, seo_title_fr: e.target.value })}
                    placeholder="Titre pour Google et l'onglet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_fr">Description Meta</Label>
                  <Textarea
                    id="meta_description_fr"
                    value={formData.meta_description_fr}
                    onChange={(e) => setFormData({ ...formData, meta_description_fr: e.target.value })}
                    placeholder="Description pour les résultats Google"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_fr">Titre Open Graph</Label>
                  <Input
                    id="og_title_fr"
                    value={formData.og_title_fr}
                    onChange={(e) => setFormData({ ...formData, og_title_fr: e.target.value })}
                    placeholder="Titre pour les réseaux sociaux"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_fr">Description Open Graph</Label>
                  <Textarea
                    id="og_description_fr"
                    value={formData.og_description_fr}
                    onChange={(e) => setFormData({ ...formData, og_description_fr: e.target.value })}
                    placeholder="Description pour les réseaux sociaux"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* OG Image - Shared */}
            <div className="space-y-2">
              <Label htmlFor="og_image">Open Graph Image</Label>
              <Input
                id="og_image"
                value={formData.og_image}
                onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                placeholder="Image URL for social media sharing"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630px. Leave empty to use hero image.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hotel Extras Section - Only show when editing existing hotel */}
        {hotelId && (
          <Card>
            <CardHeader>
              <CardTitle>Hotel Extras</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage extras that can be added to experiences at this hotel
              </p>
            </CardHeader>
            <CardContent>
              <HotelExtrasManager hotelId={hotelId} />
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
};
