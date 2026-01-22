import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '@/services/api';
import { useDateFilter } from './DateFilterContext';
import { buildDateRangeParams } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalNewUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
}

interface StatsContextType {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

interface StatsProviderProps {
  children: ReactNode;
}

export const StatsProvider: React.FC<StatsProviderProps> = ({ children }) => {
  const { dateRange } = useDateFilter();

  // Centralized stats query that all pages can reuse
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [
      'dashboard-stats',
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: () => {
      const params = buildDateRangeParams(dateRange, {
        includeDefaultStart: false,
      });
      console.log('StatsContext: Fetching centralized stats with params:', params);
      return fetchDashboardStats(params);
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return (
    <StatsContext.Provider
      value={{
        stats,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};
