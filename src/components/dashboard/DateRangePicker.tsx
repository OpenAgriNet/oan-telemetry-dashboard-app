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
import { format, subDays } from "date-fns";
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
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState("custom");

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return "Select date range";
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`;
  };

  const handleQuickSelect = (option: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    switch (option) {
      case "today":
        setDateRange({ from: startOfDay, to: today });
        break;
      case "last7":
        setDateRange({ from: subDays(today, 6), to: today });
        break;
      case "last30":
        setDateRange({ from: subDays(today, 29), to: today });
        break;
      case "custom":
        setIsCalendarOpen(true);
        break;
    }
    setSelectedOption(option);
  };

  const handleReset = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedOption("custom");
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "bg-muted/40 hover:bg-muted/60 rounded-lg px-4 py-2 h-9 font-medium text-sm",
              !dateRange.from && "text-muted-foreground"
            )}
            onClick={() => {
              setIsCalendarOpen(true);
              setSelectedOption("custom");
            }}
          >
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              disabled={(date) => date > new Date()}
              onSelect={(range) => {
                // Only set the range, don't close the popover
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                });
                
                // Set to custom mode when starting a new selection
                if (range?.from) {
                  setSelectedOption("custom");
                }
              }}
              numberOfMonths={2}
              className="flex space-x-4"
            />
          </div>
          <div className="p-3 border-t border-border flex justify-between bg-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
                setSelectedOption("custom");
                setIsCalendarOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (dateRange.from && dateRange.to) {
                  setIsCalendarOpen(false);
                }
              }}
              disabled={!dateRange.from || !dateRange.to}
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
            {selectedOption === "custom" && "Custom"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleQuickSelect("today")}>
            Today
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("last7")}>
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("last30")}>
            Last 30 days
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
