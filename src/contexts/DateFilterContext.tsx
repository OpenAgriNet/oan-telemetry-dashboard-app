import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterContextType {
  /** Debounced date range for API calls - use this in queries */
  dateRange: DateRange;
  /** Immediate date range for UI display - use this in date picker */
  immediateDateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  resetDateRange: () => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (context === undefined) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};

interface DateFilterProviderProps {
  children: ReactNode;
}

// Debounce delay in milliseconds - adjust this to control API call frequency
const DATE_DEBOUNCE_DELAY = 800;

export const DateFilterProvider: React.FC<DateFilterProviderProps> = ({ children }) => {
  const [immediateDateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Debounce the date range to prevent excessive API calls while user is selecting dates
  const debouncedFrom = useDebounce(immediateDateRange.from, DATE_DEBOUNCE_DELAY);
  const debouncedTo = useDebounce(immediateDateRange.to, DATE_DEBOUNCE_DELAY);
  
  // The main dateRange exposed to consumers is debounced
  const dateRange: DateRange = {
    from: debouncedFrom,
    to: debouncedTo,
  };

  const resetDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <DateFilterContext.Provider
      value={{
        dateRange,
        immediateDateRange,
        setDateRange,
        resetDateRange,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}; 