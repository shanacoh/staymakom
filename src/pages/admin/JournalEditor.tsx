import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, EyeOff, Clock, FileText, Check, CalendarIcon, Send, AlertTriangle } from "lucide-react";
import { generateSlug, cn } from "@/lib/utils";
import { Block, calculateReadingTime, mirrorBlocks } from "@/components/admin/journal/types";
import { BlockEditor } from "@/components/admin/journal/BlockEditor";
import { ArticlePreview } from "@/components/admin/journal/ArticlePreview";
import { format } from "date-fns";

const CATEGORIES = [
  "Stories",
  "Places",
  "Guides",
  "Food & Wine",
  "Slow Travel",
  "Behind the Scenes",
  "People",
];

const JournalEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "he">("en");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerptError, setExcerptError] = useState(false);
  const [ogAutoFilled, setOgAutoFilled] = useState({ title: false, description: false });

  const [formData, setFormData] = useState({
    title_en: "",
    title_he: "",
    slug: "",
    cover_image: "",
    category: "Stories",
    excerpt_en: "",
    excerpt_he: "",
    blocks_en: [] as Block[],
    blocks_he: [] as Block[],
    author_name: "STAYMAKOM",
    status: "draft",
    scheduled_at: null as Date | null,
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

  // Parse blocks from JSON string
  const parseBlocks = (content: string): Block[] => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Legacy HTML content - convert to single text block
      if (content.trim()) {
        return [{ id: "legacy-1", type: "text", content: content.replace(/<[^>]*>/g, "") }];
      }
      return [];
    }
  };

  // Stringify blocks to JSON
  const stringifyBlocks = (blocks: Block[]): string => {
    return JSON.stringify(blocks);
  };

  const { data: post, isLoading } = useQuery({
    queryKey: ["journal-post", id],
    queryFn: async () => {
      if (!isEdit) return null;
      const { data, error } = await supabase
        .from("journal_posts" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title_en: post.title_en || "",
        title_he: post.title_he || "",
        slug: post.slug || "",
        cover_image: post.cover_image || "",
        category: post.category,
        excerpt_en: post.excerpt_en || "",
        excerpt_he: post.excerpt_he || "",
        blocks_en: parseBlocks(post.content_en),
        blocks_he: parseBlocks(post.content_he),
        author_name: post.author_name,
        status: post.status,
        scheduled_at: post.published_at && new Date(post.published_at) > new Date() ? new Date(post.published_at) : null,
        seo_title_en: post.seo_title_en || "",
        seo_title_he: post.seo_title_he || "",
        seo_title_fr: post.seo_title_fr || "",
        meta_description_en: post.meta_description_en || "",
        meta_description_he: post.meta_description_he || "",
        meta_description_fr: post.meta_description_fr || "",
        og_title_en: post.og_title_en || "",
        og_title_he: post.og_title_he || "",
        og_title_fr: post.og_title_fr || "",
        og_description_en: post.og_description_en || "",
        og_description_he: post.og_description_he || "",
        og_description_fr: post.og_description_fr || "",
        og_image: post.og_image || "",
      });
      setSlugManuallyEdited(true);
    }
  }, [post]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && formData.title_en) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(formData.title_en) }));
    }
  }, [formData.title_en, slugManuallyEdited]);

  // Generate unique slug by checking database
  const generateUniqueSlug = async (baseSlug: string, currentId?: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const query = supabase
        .from("journal_posts" as any)
        .select("id")
        .eq("slug", slug);
      
      if (currentId) {
        query.neq("id", currentId);
      }
      
      const { data } = await query.maybeSingle();
      
      if (!data) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  // Auto-fill OG fields from title/excerpt before saving
  const prepareDataForSave = (data: typeof formData) => {
    const prepared = { ...data };
    let autoFilledTitle = false;
    let autoFilledDesc = false;

    if (!prepared.og_title_en && prepared.title_en) {
      prepared.og_title_en = prepared.title_en;
      autoFilledTitle = true;
    }
    if (!prepared.og_description_en && prepared.excerpt_en) {
      prepared.og_description_en = prepared.excerpt_en;
      autoFilledDesc = true;
    }
    if (!prepared.og_title_he && prepared.title_he) {
      prepared.og_title_he = prepared.title_he;
    }
    if (!prepared.og_description_he && prepared.excerpt_he) {
      prepared.og_description_he = prepared.excerpt_he;
    }

    setOgAutoFilled({ title: autoFilledTitle, description: autoFilledDesc });
    return prepared;
  };

  const saveToDatabase = useCallback(
    async (data: typeof formData, showToast = false) => {
      const prepared = prepareDataForSave(data);
      const baseSlug = prepared.slug || generateSlug(prepared.title_en);
      const uniqueSlug = await generateUniqueSlug(baseSlug, isEdit ? id : undefined);
      
      const dataToSave = {
        title_en: prepared.title_en,
        title_he: prepared.title_he,
        slug: uniqueSlug,
        cover_image: prepared.cover_image,
        category: prepared.category,
        excerpt_en: prepared.excerpt_en,
        excerpt_he: prepared.excerpt_he,
        content_en: stringifyBlocks(prepared.blocks_en),
        content_he: stringifyBlocks(prepared.blocks_he),
        author_name: prepared.author_name,
        status: prepared.status,
        seo_title_en: prepared.seo_title_en,
        seo_title_he: prepared.seo_title_he,
        seo_title_fr: prepared.seo_title_fr,
        meta_description_en: prepared.meta_description_en,
        meta_description_he: prepared.meta_description_he,
        meta_description_fr: prepared.meta_description_fr,
        og_title_en: prepared.og_title_en,
        og_title_he: prepared.og_title_he,
        og_title_fr: prepared.og_title_fr,
        og_description_en: prepared.og_description_en,
        og_description_he: prepared.og_description_he,
        og_description_fr: prepared.og_description_fr,
        og_image: prepared.og_image,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("journal_posts" as any)
          .update(dataToSave as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("journal_posts" as any)
          .insert([dataToSave as any])
          .select()
          .single();
        if (error) throw error;
        if (inserted && (inserted as any).id) {
          navigate(`/admin/journal/edit/${(inserted as any).id}`, { replace: true });
        }
      }

      setLastSaved(new Date());
      if (showToast) {
        toast.success("Saved");
      }
    },
    [isEdit, id, navigate]
  );

  // Autosave effect
  useEffect(() => {
    if (!formData.title_en) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(formData, false).catch((err) => {
        console.error("Autosave failed:", err);
      });
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formData, saveToDatabase]);

  const handleSave = () => {
    if (!formData.excerpt_en.trim()) {
      setExcerptError(true);
      toast.error("Excerpt is required for listing cards");
      return;
    }
    setExcerptError(false);
    saveMutation.mutate();
  };

  const saveMutation = useMutation({
    mutationFn: () => saveToDatabase(formData, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save article");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (scheduleDate?: Date | null) => {
      if (!formData.excerpt_en.trim()) {
        setExcerptError(true);
        throw new Error("Excerpt is required for listing cards");
      }
      setExcerptError(false);

      const prepared = prepareDataForSave(formData);
      const isScheduled = scheduleDate && scheduleDate > new Date();
      const baseSlug = prepared.slug || generateSlug(prepared.title_en);
      const uniqueSlug = await generateUniqueSlug(baseSlug, isEdit ? id : undefined);
      
      const dataToSave = {
        ...prepared,
        content_en: stringifyBlocks(prepared.blocks_en),
        content_he: stringifyBlocks(prepared.blocks_he),
        slug: uniqueSlug,
        status: "published" as const,
        published_at: isScheduled ? scheduleDate.toISOString() : new Date().toISOString(),
      };

      const { blocks_en, blocks_he, scheduled_at, ...dbData } = dataToSave as any;

      if (isEdit) {
        const { error } = await supabase
          .from("journal_posts" as any)
          .update(dbData as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("journal_posts" as any).insert([dbData as any]);
        if (error) throw error;
      }
      
      return isScheduled;
    },
    onSuccess: (isScheduled) => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });
      toast.success(isScheduled ? "Article scheduled for publication" : "Article published successfully");
      navigate("/admin/journal");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to publish article");
    },
  });

  const { words: wordsEn, minutes: minutesEn } = calculateReadingTime(formData.blocks_en);
  const { words: wordsHe, minutes: minutesHe } = calculateReadingTime(formData.blocks_he);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex items-center justify-between h-14">
            <Button variant="ghost" onClick={() => setIsPreviewMode(false)}>
              <EyeOff className="w-4 h-4 mr-2" />
              Exit Preview
            </Button>
            <div className="flex gap-2">
              <Button
                variant={previewLang === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewLang("en")}
              >
                English
              </Button>
              <Button
                variant={previewLang === "he" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewLang("he")}
              >
                עברית
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container py-8" dir={previewLang === "he" ? "rtl" : "ltr"}>
          <ArticlePreview
            title={previewLang === "en" ? formData.title_en : formData.title_he}
            coverImage={formData.cover_image}
            excerpt={previewLang === "en" ? formData.excerpt_en : formData.excerpt_he}
            blocks={previewLang === "en" ? formData.blocks_en : formData.blocks_he}
            author={formData.author_name}
            category={formData.category}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/admin/journal">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastSaved && (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            size="sm" 
            onClick={() => publishMutation.mutate(formData.scheduled_at)} 
            disabled={publishMutation.isPending}
          >
            {formData.scheduled_at && formData.scheduled_at > new Date() ? (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Schedule
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Cover Image */}
            <ImageUpload
              label="Cover Image"
              bucket="journal-images"
              value={formData.cover_image}
              onChange={(url) => setFormData({ ...formData, cover_image: url })}
              description="Main image displayed at the top of your article"
            />

            {/* Title & Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Article Title (EN) *</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="Enter article title..."
                  className="text-xl font-semibold h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Excerpt — Required */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Excerpt (EN) *
                {excerptError && (
                  <span className="text-destructive text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Required for listing cards
                  </span>
                )}
              </Label>
              <Textarea
                value={formData.excerpt_en}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 160);
                  setFormData({ ...formData, excerpt_en: val });
                  if (val.trim()) setExcerptError(false);
                }}
                placeholder="A short introduction that appears in article lists..."
                rows={2}
                maxLength={160}
                className={excerptError ? "border-destructive" : ""}
              />
              <p className={`text-xs ${formData.excerpt_en.length >= 150 ? "text-amber-600" : "text-muted-foreground"}`}>
                {formData.excerpt_en.length}/160 characters
              </p>
            </div>

            {/* Word Count & Reading Time */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{wordsEn} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{minutesEn} min read</span>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="en">English Content</TabsTrigger>
                <TabsTrigger value="he">Hebrew Content</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="mt-0">
                <BlockEditor
                  blocks={formData.blocks_en}
                  onChange={(blocks) => setFormData({ ...formData, blocks_en: blocks })}
                />
              </TabsContent>

              <TabsContent value="he" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Article Title (HE)</Label>
                      <Input
                        value={formData.title_he}
                        onChange={(e) => setFormData({ ...formData, title_he: e.target.value })}
                        placeholder="כותרת המאמר..."
                        className="bg-[#EAF4FF] text-lg"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Excerpt (HE)</Label>
                      <Input
                        value={formData.excerpt_he}
                        onChange={(e) => setFormData({ ...formData, excerpt_he: e.target.value })}
                        placeholder="תיאור קצר..."
                        className="bg-[#EAF4FF]"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-3">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{wordsHe} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{minutesHe} min read</span>
                    </div>
                  </div>
                  <BlockEditor
                    blocks={formData.blocks_he}
                    onChange={(blocks) => setFormData({ ...formData, blocks_he: blocks })}
                    isHebrew
                    sourceBlocks={formData.blocks_en}
                    onMirror={() => {
                      const mirrored = mirrorBlocks(formData.blocks_en);
                      setFormData({ ...formData, blocks_he: mirrored });
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: SEO Panel */}
        <div className="w-80 border-l bg-muted/20 overflow-y-auto p-4 shrink-0 hidden lg:block">
          <h3 className="font-semibold mb-4">SEO & Settings</h3>

          <div className="space-y-6">
            {/* Slug */}
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setFormData({ ...formData, slug: e.target.value });
                }}
                placeholder="article-url-slug"
              />
              <p className="text-xs text-muted-foreground">
                /journal/{formData.slug || "..."}
              </p>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>

            {/* Scheduled Publishing */}
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Schedule Publication
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_at && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_at ? (
                      format(formData.scheduled_at, "PPP 'at' p")
                    ) : (
                      <span>Publish immediately</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_at || undefined}
                    onSelect={(date) => setFormData({ ...formData, scheduled_at: date || null })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {formData.scheduled_at && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Article will go live on {format(formData.scheduled_at, "MMM d, yyyy")}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => setFormData({ ...formData, scheduled_at: null })}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* English SEO */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">English SEO</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">SEO Title</Label>
                <Input
                  value={formData.seo_title_en}
                  onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                  placeholder={formData.title_en || "SEO title..."}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={formData.meta_description_en}
                  onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                  placeholder="Description for search engines..."
                  rows={2}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description_en.length}/160
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Title</Label>
                <Input
                  value={formData.og_title_en}
                  onChange={(e) => {
                    setFormData({ ...formData, og_title_en: e.target.value });
                    setOgAutoFilled(prev => ({ ...prev, title: false }));
                  }}
                  placeholder="Social share title..."
                  className="text-sm"
                />
                {ogAutoFilled.title && (
                  <p className="text-xs text-muted-foreground italic">Auto-filled from title</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Description</Label>
                <Textarea
                  value={formData.og_description_en}
                  onChange={(e) => {
                    setFormData({ ...formData, og_description_en: e.target.value });
                    setOgAutoFilled(prev => ({ ...prev, description: false }));
                  }}
                  placeholder="Social share description..."
                  rows={2}
                  className="text-sm"
                />
                {ogAutoFilled.description && (
                  <p className="text-xs text-muted-foreground italic">Auto-filled from excerpt</p>
                )}
              </div>
            </div>

            {/* Hebrew SEO */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Hebrew SEO</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">SEO Title (HE)</Label>
                <Input
                  value={formData.seo_title_he}
                  onChange={(e) => setFormData({ ...formData, seo_title_he: e.target.value })}
                  placeholder="כותרת SEO..."
                  className="text-sm bg-[#EAF4FF]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Meta Description (HE)</Label>
                <Textarea
                  value={formData.meta_description_he}
                  onChange={(e) => setFormData({ ...formData, meta_description_he: e.target.value })}
                  placeholder="תיאור למנועי חיפוש..."
                  rows={2}
                  className="text-sm bg-[#EAF4FF]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Title (HE)</Label>
                <Input
                  value={formData.og_title_he}
                  onChange={(e) => setFormData({ ...formData, og_title_he: e.target.value })}
                  placeholder="כותרת לשיתוף..."
                  className="text-sm bg-[#EAF4FF]"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Description (HE)</Label>
                <Textarea
                  value={formData.og_description_he}
                  onChange={(e) => setFormData({ ...formData, og_description_he: e.target.value })}
                  placeholder="תיאור לשיתוף..."
                  rows={2}
                  className="text-sm bg-[#EAF4FF]"
                  dir="rtl"
                />
              </div>
            </div>

            {/* French SEO */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">French SEO</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">SEO Title (FR)</Label>
                <Input
                  value={formData.seo_title_fr}
                  onChange={(e) => setFormData({ ...formData, seo_title_fr: e.target.value })}
                  placeholder="Titre SEO..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Meta Description (FR)</Label>
                <Textarea
                  value={formData.meta_description_fr}
                  onChange={(e) => setFormData({ ...formData, meta_description_fr: e.target.value })}
                  placeholder="Description pour les moteurs..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Title (FR)</Label>
                <Input
                  value={formData.og_title_fr}
                  onChange={(e) => setFormData({ ...formData, og_title_fr: e.target.value })}
                  placeholder="Titre de partage..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">OG Description (FR)</Label>
                <Textarea
                  value={formData.og_description_fr}
                  onChange={(e) => setFormData({ ...formData, og_description_fr: e.target.value })}
                  placeholder="Description de partage..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>

            {/* OG Image */}
            <div className="space-y-2 pt-4 border-t">
              <ImageUpload
                label="OG Image (Social Share)"
                bucket="journal-images"
                value={formData.og_image}
                onChange={(url) => setFormData({ ...formData, og_image: url })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
