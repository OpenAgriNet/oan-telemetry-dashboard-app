import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "p-0 border-none bg-transparent shadow-none hover:bg-transparent focus:ring-0",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <div className="flex flex-col items-center justify-center bg-muted/40 rounded-2xl px-10 py-3 min-w-[420px]">
              <div className="flex flex-row justify-center items-stretch gap-14 w-full">
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs font-medium text-muted-foreground text-center tracking-wide mb-1">Start Date</span>
                  <div className="flex items-center gap-2 justify-center">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-[1.05rem]">
                      {dateRange.from ? format(dateRange.from, "LLL dd, y") : <span className="text-muted-foreground">Pick start</span>}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-semibold text-muted-foreground">to</span>
                </div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs font-medium text-muted-foreground text-center tracking-wide mb-1">End Date</span>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-semibold text-[1.05rem]">
                      {dateRange.to ? format(dateRange.to, "LLL dd, y") : <span className="text-muted-foreground">Pick end</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="mb-2 text-sm font-semibold text-primary">Select Date Range</div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) => {
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                });
                // Only close if both dates are picked
                if (range?.from && range?.to) {
                  setIsOpen(false);
                }
              }}
            />
          </div>
          <div className="p-3 border-t border-border flex justify-between bg-muted">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsOpen(false);
              }}
              disabled={!dateRange.from || !dateRange.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
