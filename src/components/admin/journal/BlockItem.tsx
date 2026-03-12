import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Block, BlockType } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { SmartLinkPicker } from "@/components/ui/smart-link-picker";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Type,
  FileText,
  Image,
  MousePointerClick,
  Quote,
  List,
  Plus,
  X,
  Sparkles,
  Minus,
  MessageSquareQuote,
} from "lucide-react";

interface BlockItemProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isHebrew?: boolean;
}

const blockTypeIcons: Record<BlockType, React.ReactNode> = {
  title: <Type className="w-4 h-4" />,
  text: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  cta: <MousePointerClick className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  list: <List className="w-4 h-4" />,
  experience: <Sparkles className="w-4 h-4" />,
  pull_quote: <MessageSquareQuote className="w-4 h-4" />,
  divider: <Minus className="w-4 h-4" />,
};

const blockTypeLabels: Record<BlockType, string> = {
  title: "Title",
  text: "Rich Text",
  image: "Image",
  cta: "CTA Button",
  quote: "Quote",
  list: "List",
  experience: "Experience",
  pull_quote: "Pull Quote",
  divider: "Divider",
};

// Fetch experiences for the experience block
function useExperiences() {
  return useQuery({
    queryKey: ["experiences-for-embed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("id, title, slug, hero_image, status")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
  });
}

export function BlockItem({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isHebrew = false,
}: BlockItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { data: experiences = [] } = useExperiences();

  const inputClass = isHebrew ? "bg-[#EAF4FF]" : "";
  const dir = isHebrew ? "rtl" : "ltr";

  const renderBlockContent = () => {
    switch (block.type) {
      case "title":
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select
                value={block.level}
                onValueChange={(value: "h1" | "h2" | "h3") =>
                  onChange({ ...block, level: value })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={block.content}
                onChange={(e) => onChange({ ...block, content: e.target.value })}
                placeholder="Enter title..."
                className={`flex-1 font-semibold ${inputClass}`}
                dir={dir}
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className={isHebrew ? "bg-[#EAF4FF] rounded-lg p-1" : ""}>
            <RichTextEditor
              content={block.content}
              onChange={(content) => onChange({ ...block, content })}
              placeholder="Write your content here with formatting..."
              dir={dir}
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
            <ImageUpload
              label="Image"
              bucket="journal-images"
              value={block.url}
              onChange={(url) => onChange({ ...block, url })}
            />
            <Input
              value={block.alt}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              placeholder="Alt text (for accessibility)"
              className={inputClass}
              dir={dir}
            />
            <Input
              value={block.caption}
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
              placeholder="Caption (optional)"
              className={inputClass}
              dir={dir}
            />
          </div>
        );

      case "cta":
        return (
          <div className="space-y-3">
            <Input
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              placeholder="Button text (e.g., Book Now)"
              className={inputClass}
              dir={dir}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Link destination</label>
              <SmartLinkPicker
                value={block.url}
                onChange={(url) => onChange({ ...block, url })}
              />
            </div>
            {/* CTA Preview */}
            {block.text && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground mb-2 block">Preview:</span>
                <Button className="pointer-events-none">
                  {block.text}
                </Button>
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div className="space-y-3">
            <Textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="Enter quote..."
              rows={3}
              className={`italic ${inputClass}`}
              dir={dir}
            />
            <Input
              value={block.author}
              onChange={(e) => onChange({ ...block, author: e.target.value })}
              placeholder="Author (optional)"
              className={inputClass}
              dir={dir}
            />
          </div>
        );

      case "pull_quote":
        return (
          <div className="space-y-3">
            <Textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              placeholder="Enter pull quote — editorial highlight text..."
              rows={3}
              className={`italic ${inputClass}`}
              dir={dir}
            />
            {/* Pull Quote Preview */}
            {block.content && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground mb-2 block">Preview:</span>
                <div className="border-l-[3px] border-[#B8935A] pl-6 py-2 italic text-lg text-[#5C4A3A] max-w-md">
                  {block.content}
                </div>
              </div>
            )}
          </div>
        );

      case "divider":
        return (
          <div className="py-4 text-center">
            <span className="text-[#B8935A] text-sm tracking-[0.3em]">— ✦ —</span>
            <p className="text-xs text-muted-foreground mt-2">Decorative divider</p>
          </div>
        );

      case "list":
        return (
          <div className="space-y-3">
            <Select
              value={block.style}
              onValueChange={(value: "bullet" | "numbered") =>
                onChange({ ...block, style: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullet">Bullet</SelectItem>
                <SelectItem value="numbered">Numbered</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              {block.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-muted-foreground w-6 text-center">
                    {block.style === "bullet" ? "•" : `${index + 1}.`}
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...block.items];
                      newItems[index] = e.target.value;
                      onChange({ ...block, items: newItems });
                    }}
                    placeholder="List item..."
                    className={`flex-1 ${inputClass}`}
                    dir={dir}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = block.items.filter((_, i) => i !== index);
                      onChange({ ...block, items: newItems.length ? newItems : [""] });
                    }}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...block, items: [...block.items, ""] })}
              >
                <Plus className="w-4 h-4 mr-1" /> Add item
              </Button>
            </div>
          </div>
        );

      case "experience":
        const selectedExp = experiences.find(e => e.id === block.experience_id);
        return (
          <div className="space-y-3">
            <Select
              value={block.experience_id}
              onValueChange={(value) => onChange({ ...block, experience_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an experience to embed..." />
              </SelectTrigger>
              <SelectContent>
                {experiences.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Experience Preview */}
            {selectedExp && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex gap-4">
                  {selectedExp.hero_image && (
                    <img 
                      src={selectedExp.hero_image} 
                      alt={selectedExp.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedExp.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Will render as an experience card in the article
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!selectedExp && block.experience_id && (
              <p className="text-sm text-destructive">
                Experience not found or has been archived/deleted
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={`border rounded-lg bg-card transition-all ${
        isDragging ? "opacity-50 border-primary" : ""
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          draggable
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-2 text-sm font-medium">
          {blockTypeIcons[block.type]}
          {blockTypeLabels[block.type]}
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-7 w-7"
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={isLast}
            className="h-7 w-7"
          >
            ↓
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Block Content */}
      <div className="p-4">{renderBlockContent()}</div>
    </div>
  );
}
