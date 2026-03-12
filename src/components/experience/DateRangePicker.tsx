import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value: { from?: Date; to?: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Suppress pointer events on Leaflet map while calendar is open
  useEffect(() => {
    const maps = document.querySelectorAll<HTMLElement>('.leaflet-container');
    maps.forEach((el) => {
      el.style.pointerEvents = isOpen ? 'none' : '';
    });
    return () => {
      maps.forEach((el) => {
        el.style.pointerEvents = '';
      });
    };
  }, [isOpen]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Dates</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          style={{
            zIndex: 1000,
            backgroundColor: '#FAF8F4',
            border: '1px solid #E8E0D4',
            borderRadius: '4px',
            boxShadow: '0 8px 32px rgba(26,24,20,0.12)',
          }}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value as DateRange}
            onSelect={(range) => {
              onChange({
                from: range?.from,
                to: range?.to,
              });
            }}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
            className="pointer-events-auto p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-bold",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-[#F0EBE3] rounded-full flex items-center justify-center transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "rounded-md w-9 font-normal text-[11px] uppercase tracking-[0.08em]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal text-sm rounded-full hover:bg-[#F0EBE3] transition-colors aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-[#1A1814] text-white hover:bg-[#1A1814] hover:text-white focus:bg-[#1A1814] focus:text-white rounded-full",
              day_today: "bg-[#F0EBE3] rounded-full",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-[0.35]",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            styles={{
              head_cell: { color: '#8C7B6B' },
              caption_label: { color: '#1A1814', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
              day: { color: '#2C2520', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
              nav_button: { color: '#1A1814' },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
