import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, Globe, MapPin, Hotel } from "lucide-react";

interface SmartLinkPickerProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

const SITE_PAGES = [
  { label: "Homepage", path: "/" },
  { label: "Contact", path: "/contact" },
  { label: "About", path: "/about" },
  { label: "Gift Card", path: "/gift-card" },
  { label: "Partners", path: "/partners" },
  { label: "Companies", path: "/companies" },
  { label: "Journal", path: "/journal" },
];

export function SmartLinkPicker({ value, onChange, className }: SmartLinkPickerProps) {
  const [activeTab, setActiveTab] = useState(() => {
    if (!value) return "url";
    if (value.startsWith("/experience/")) return "experiences";
    if (value.startsWith("/hotel/")) return "hotels";
    if (value.startsWith("/category/")) return "categories";
    if (SITE_PAGES.some(p => p.path === value)) return "pages";
    return "url";
  });

  // Fetch published experiences
  const { data: experiences = [] } = useQuery({
    queryKey: ["experiences-for-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select("id, title, slug, status")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch published hotels
  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels-for-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name, slug, status")
        .eq("status", "published")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch published categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, status")
        .eq("status", "published")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleExperienceSelect = (slug: string) => {
    onChange(`/experience/${slug}`);
  };

  const handleHotelSelect = (slug: string) => {
    onChange(`/hotel/${slug}`);
  };

  const handleCategorySelect = (slug: string) => {
    onChange(`/category/${slug}`);
  };

  const handlePageSelect = (path: string) => {
    onChange(path);
  };

  // Extract selected value for each type
  const getSelectedExperience = () => {
    if (value.startsWith("/experience/")) {
      return value.replace("/experience/", "");
    }
    return "";
  };

  const getSelectedHotel = () => {
    if (value.startsWith("/hotel/")) {
      return value.replace("/hotel/", "");
    }
    return "";
  };

  const getSelectedCategory = () => {
    if (value.startsWith("/category/")) {
      return value.replace("/category/", "");
    }
    return "";
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="url" className="text-xs px-2 py-1.5">
            <Link className="w-3 h-3 mr-1" />
            URL
          </TabsTrigger>
          <TabsTrigger value="pages" className="text-xs px-2 py-1.5">
            <Globe className="w-3 h-3 mr-1" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="experiences" className="text-xs px-2 py-1.5">
            <MapPin className="w-3 h-3 mr-1" />
            Exp.
          </TabsTrigger>
          <TabsTrigger value="hotels" className="text-xs px-2 py-1.5">
            <Hotel className="w-3 h-3 mr-1" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs px-2 py-1.5">
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-3">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com or /page-path"
          />
        </TabsContent>

        <TabsContent value="pages" className="mt-3">
          <Select value={value} onValueChange={handlePageSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a page..." />
            </SelectTrigger>
            <SelectContent>
              {SITE_PAGES.map((page) => (
                <SelectItem key={page.path} value={page.path}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="experiences" className="mt-3">
          <Select value={getSelectedExperience()} onValueChange={handleExperienceSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select an experience..." />
            </SelectTrigger>
            <SelectContent>
              {experiences.map((exp) => (
                <SelectItem key={exp.id} value={exp.slug}>
                  {exp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="hotels" className="mt-3">
          <Select value={getSelectedHotel()} onValueChange={handleHotelSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a hotel..." />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.slug}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>

        <TabsContent value="categories" className="mt-3">
          <Select value={getSelectedCategory()} onValueChange={handleCategorySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>

      {value && (
        <p className="text-xs text-muted-foreground mt-2">
          Link: <code className="bg-muted px-1 rounded">{value}</code>
        </p>
      )}
    </div>
  );
}
