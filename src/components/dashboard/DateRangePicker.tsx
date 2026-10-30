import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: React.Dispatch<
    React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
  >;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  setDateRange,
}) => {
  const isMobile = useIsMobile();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState("last7");
  const [draftRange, setDraftRange] = React.useState(dateRange);
  const openCalendar = (open: boolean) => {
    if (open) setDraftRange(dateRange);
    setIsCalendarOpen(open);
  };
  const hasInitialized = React.useRef(false);
  const openingFromMenu = React.useRef(false);

  // Set default to last 7 days on component mount
  React.useEffect(() => {
    if (!hasInitialized.current && !dateRange.from && !dateRange.to) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      setDateRange({ from: subDays(startOfDay(today), 6), to: today });
      hasInitialized.current = true;
    }
  }, [dateRange.from, dateRange.to, setDateRange]);

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return "Select date range";
    return `${format(dateRange.from, "MMM dd")} - ${format(
      dateRange.to,
      "MMM dd, yyyy"
    )}`;
  };

  const handleQuickSelect = (option: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayStart = startOfDay(today);

    switch (option) {
      case "today":
        setDateRange({ from: dayStart, to: today });
        break;
      case "last7":
        setDateRange({ from: subDays(startOfDay(today), 6), to: today });
        break;
      case "last30":
        setDateRange({ from: subDays(startOfDay(today), 29), to: today });
        break;
      case "alltime":
        setDateRange({ from: new Date("2025-05-01T00:00:00.000Z"), to: today });
        break;
      case "custom":
        openingFromMenu.current = true;
        return;
    }
    setSelectedOption(option);
  };

  const handleReset = () => {
    // Reset to last 7 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setDateRange({ from: subDays(startOfDay(today), 6), to: today });
    setSelectedOption("last7");
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Popover open={isCalendarOpen} onOpenChange={openCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "bg-muted/40 hover:bg-muted/60 rounded-lg px-4 py-2 h-9 font-medium text-sm",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto p-0" align="start">
          <div className="p-1 sm:p-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={draftRange.from}
              selected={{
                from: draftRange.from,
                to: draftRange.to,
              }}
              disabled={(date) => date > new Date()}
              onSelect={(range) => {
                setDraftRange({ from: range?.from, to: range?.to });
              }}
              numberOfMonths={isMobile ? 1 : 2}
            />
          </div>
          <div className="p-3 border-t border-border flex justify-between bg-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                setIsCalendarOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (draftRange.from && draftRange.to) {
                  setDateRange(draftRange);
                  setSelectedOption("custom");
                  setIsCalendarOpen(false);
                }
              }}
              disabled={!draftRange.from || !draftRange.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-muted/40 hover:bg-muted/60 rounded-lg px-3 py-2 h-9 font-medium text-sm"
          >
            {selectedOption === "today" && "Today"}
            {selectedOption === "last7" && "Last 7 days"}
            {selectedOption === "last30" && "Last 30 days"}
            {selectedOption === "alltime" && "All time"}
            {selectedOption === "custom" && "Custom"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onCloseAutoFocus={(event) => {
          // Keep focus in the newly opened calendar instead of returning it to the preset menu.
          if (openingFromMenu.current) {
            event.preventDefault();
            openingFromMenu.current = false;
            openCalendar(true);
          }
        }}>
          <DropdownMenuItem onClick={() => handleQuickSelect("today")}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("last7")}>
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("last30")}>
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("alltime")}>
            All time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("custom")}>
            Custom
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="bg-muted/40 hover:bg-muted/60 rounded-lg h-9 px-3 font-medium"
      >
        Reset
      </Button>
    </div>
  );
};

export default DateRangePicker;
