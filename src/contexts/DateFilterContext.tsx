import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterContextType {
  dateRange: DateRange;
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

export const DateFilterProvider: React.FC<DateFilterProviderProps> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const resetDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <DateFilterContext.Provider
      value={{
        dateRange,
        setDateRange,
        resetDateRange,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
}; 