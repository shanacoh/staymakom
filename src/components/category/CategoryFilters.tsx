import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SlidersHorizontal, MapPin, Calendar as CalendarIcon, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useLanguage } from "@/hooks/useLanguage";
import { dateFnsLocale } from "@/lib/dateFnsLocale";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { tPage } from "@/lib/translations";

interface CategoryFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
  onShowMapToggle?: (show: boolean) => void;
  showMap?: boolean;
  className?: string;
}

export interface FilterState {
  sortBy: string;
  priceRange: [number, number];
  partySize: number;
  region?: string;
  dateRange?: DateRange;
}

const sortOptions = [
  { value: "recommended", labelKey: "categoryFiltersRecommended" },
  { value: "price_asc", labelKey: "categoryFiltersPriceLowToHigh" },
  { value: "price_desc", labelKey: "categoryFiltersPriceHighToLow" },
  { value: "duration", labelKey: "categoryFiltersDuration" },
] as const;

const CategoryFilters = ({ onFilterChange, onShowMapToggle, showMap = false, className }: CategoryFiltersProps) => {
  const { locale } = useLanguage();
  const dateLocale = dateFnsLocale(locale);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "recommended",
    priceRange: [0, 1000],
    partySize: 2,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleFilterUpdate = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    const newFilters = { ...filters, dateRange: range };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className={cn(
      "sticky top-0 z-40 py-3 sm:py-4",
      "bg-gradient-to-b from-background via-background to-background/95",
      "backdrop-blur-sm",
      className
    )}>
      <div className="container flex items-center justify-between gap-3">
        {/* Left side: Compact icon buttons */}
        <div className="flex items-center gap-2">
          {/* Sort Button with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted"
                title={tPage("categoryFiltersSort")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="flex flex-col">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterUpdate("sortBy", option.value)}
                    className={cn(
                      "px-3 py-2 text-sm text-left rounded-md transition-colors",
                      "hover:bg-muted",
                      filters.sortBy === option.value && "bg-muted font-medium"
                    )}
                  >
                    {tPage(option.labelKey)}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filters Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted"
                title={tPage("categoryFiltersFilters")}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{tPage("categoryFiltersFilterExperiences")}</h3>
                <div>
                  <label className="text-sm font-medium mb-3 block">{tPage("categoryFiltersBudgetPerPerson")}</label>
                  <Slider
                    min={0}
                    max={1000}
                    step={50}
                    value={filters.priceRange}
                    onValueChange={(value) => handleFilterUpdate("priceRange", value as [number, number])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">{tPage("categoryFiltersNumberOfGuests")}</label>
                  <Select
                    value={filters.partySize.toString()}
                    onValueChange={(value) => handleFilterUpdate("partySize", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {tPage("categoryFiltersGuestCount")(size)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Map Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShowMapToggle?.(!showMap)}
            className={cn(
              "h-9 w-9 rounded-full transition-colors",
              showMap 
                ? "bg-foreground text-background hover:bg-foreground/90" 
                : "bg-muted/50 hover:bg-muted"
            )}
            title={showMap ? tPage("categoryFiltersHideMap") : tPage("categoryFiltersShowMap")}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side: Premium Calendar */}
        <div className="flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start text-left font-medium",
                  "min-w-[160px] sm:min-w-[280px]",
                  "bg-white rounded-xl shadow-md border-0",
                  "hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
                  "py-3 px-4 h-auto",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5 text-cta drop-shadow-[0_6px_10px_hsl(var(--cta)/0.35)] flex-shrink-0" />
                <span className="truncate">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d MMM", { locale: dateLocale })} -{" "}
                        {format(dateRange.to, "d MMM", { locale: dateLocale })}
                      </>
                    ) : (
                      format(dateRange.from, "d MMM yyyy", { locale: dateLocale })
                    )
                  ) : (
                    <span className="hidden sm:inline">{tPage("categoryFiltersSelectDates")}</span>
                  )}
                  <span className="sm:hidden">
                    {dateRange?.from ? "" : tPage("categoryFiltersDates")}
                  </span>
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                locale={dateLocale}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilters;
