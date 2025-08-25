import React from 'react';
import { API_CONFIG } from '../config/environment';
import dailyMetrics from '../data/dailyMetrics.json';

// API Base URL
const { SERVER_URL } = API_CONFIG;

// Types
export interface User {
  id: string;
  username: string;
  sessions: number;
  latestSession: string;
  // Additional fields from API documentation
  totalQuestions?: number;
  totalSessions?: number;
  firstActivity?: string;
  lastActivity?: string;
  sessionId?: string;
  feedbackCount?: number;
  likes?: number;
  dislikes?: number;
  [key: string]: unknown;
}

export interface Session {
  sessionId: string;
  username: string;
  questionCount: number;
  sessionTime: string;
  // Additional fields from API documentation
  userId?: string;
  startTime?: string;
  endTime?: string;
  totalQuestions?: number;
  totalFeedback?: number;
  totalErrors?: number;
  [key: string]: unknown;
}

export interface Question {
  id: number;
  qid: string;
  question: string;
  answer: string | null;
  question_type?: string;
  user_id: string;
  created_at: string;
  ets?: string;
  channel: string;
  session_id: string;
  dateAsked?: string;
  hasVoiceInput?: boolean;
  reaction?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface DailyMetric {
  date: string;
  uniqueLogins: number;
  questionsAsked: number;
  reactionsCollected: number;
  voiceInputs: number;
  mobileUsers: number;
  desktopUsers: number;
}

export interface UserReport {
  id: string;
  name: string;
  numSessions: number;
  numQuestions: number;
  firstSessionDate: string;
  lastSessionDate: string;
}

export interface Feedback {
  user: string;
  id: string;
  date: string;
  question: string;
  answer: string;
  rating: string;
  feedback: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface FeedbackResponse {
  qid: string;
  date: string;
  user: string;
  question: string;
  sessionId: string;
  answer: string;
  rating: string;
  feedback: string;
  id: string;
  timestamp: string;
}

export interface Translation {
  questionMarathi: string;
  feedbackMarathi: string;
  responseMarathi: string;
}

export interface SessionEvent {
  type: string;
  timestamp: string;
  icon?: string | React.ElementType;
  sampleData: string | string[] | object;
  clip?: string;
}

export interface UserStats {
  totalUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  dailyActivity: Array<{
    date: string;
    users: number;
    sessions: number;
    questions: number;
  }>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  granularity?: string;
}

export interface UserPaginationParams extends PaginationParams {
  username?: string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SessionPaginationParams extends PaginationParams {
  sessionId?: string;
  userId?: string;
}

export interface QuestionPaginationParams extends PaginationParams {
  userId?: string;
  sessionId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response interface for Questions API (matches actual backend response)
export interface QuestionsAPIResponse {
  success: boolean;
  data: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

// API Response interface for other endpoints (general structure)
export interface APIResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters?: {
    search?: string;
    startDate?: string;
    endDate?: string;
  };
}

// Feedback API Response interface (matches actual backend response)
export interface FeedbackAPIResponse {
  data: FeedbackResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    totalLikes?: number;
    totalDislikes?: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

// Sessions API Response interface (matches actual backend response)
export interface SessionsAPIResponse {
  success: boolean;
  data: SessionResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

// Session response from backend
export interface SessionResponse {
  sessionId: string;
  username: string;
  questionCount: number;
  sessionTime: string;
  timestamp: string;
}

// Feedback response from session API (based on formatFeedbackData from backend)
export interface FeedbackSessionAPIResponse {
  qid: string;
  date: string;
  user: string;
  question: string;
  sessionId: string;
  answer: string;
  rating: string;
  feedback: string;
  id: string;
  timestamp: string;
}

// Detailed session data from getSessionById
export interface SessionDetail {
  sessionId: string;
  username: string;
  questions: Array<{
    id: string;
    timestamp: string;
    createdAt: string;
    channel: string;
    questionText: string;
    answerText: string;
  }>;
  feedback: Array<{
    id: string;
    timestamp: string;
    createdAt: string;
    channel: string;
    feedbackText: string;
    feedbackType: string;
  }>;
  errors: Array<{
    id: string;
    timestamp: string;
    createdAt: string;
    channel: string;
  }>;
  totalItems: number;
}

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// Utility function to build query parameters
const buildQueryParams = (params: Record<string, string | number | boolean>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

// Users API Response interface (matches actual backend response)
export interface UsersAPIResponse {
  success: boolean;
  data: UserResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
    sortBy: string;
    sortDirection: string;
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

// User response from backend
export interface UserResponse {
  id: string;
  username: string;
  sessions: number;
  totalQuestions: number;
  feedbackCount: number;
  likes: number;
  dislikes: number;
  latestSession: string;
  firstSession: string;
  lastActivity: string;
  latestTimestamp: string;
  firstTimestamp: string;
  channelsUsed?: number;
  channels?: string[];
  sessionId?: string;
}

// User statistics from getUserStats endpoint
export interface UserStatsResponse {
  totalUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
  avgSessionDuration: number;
  newUsers: number;
  returningUsers: number;
  activeCumulative: number;
  dailyActivity: Array<{
    date: string;
    activeUsers: number;
    questionsCount: number;
  }>;
}

// For users graph data (time series)
export interface UsersGraphDataPoint {
  date: string;
  hour?: number;
  uniqueUsersCount: number;
  [key: string]: string | number | undefined;
}

export interface UsersGraphResponse {
  data: UsersGraphDataPoint[];
  metadata: {
    granularity: string;
    totalDataPoints: number;
    dateRange: { start: string | null; end: string | null };
    summary: {
      totalUniqueUsers: number;
      peakActivity: { date: string | null; uniqueUsersCount: number };
    };
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    granularity: string;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

// Health Check Types
export interface HealthDependency {
  status: "healthy" | "unhealthy" | "degraded";
  latency_ms: number;
}

export interface HealthResponse {
  app: {
    name: string;
    version: string;
    environment: string;
    uptime_seconds: number;
  };
  dependencies: {
    [key: string]: HealthDependency;
  };
}

export interface ServiceHealth {
  name: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  health?: HealthResponse;
  error?: string;
  responseTime?: number;
  lastChecked: string;
}

// Health Check API
export const fetchHealthStatus = async (url: string): Promise<ServiceHealth> => {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const health: HealthResponse = await response.json();
    
    // Map health status to our status type
    let status: "operational" | "degraded" | "outage" = "operational";
    
    // Check dependencies for overall status
    const dependencyStatuses = Object.values(health.dependencies || {});
    const hasUnhealthy = dependencyStatuses.some(dep => dep.status === "unhealthy");
    const hasDegraded = dependencyStatuses.some(dep => dep.status === "degraded");
    
    if (hasUnhealthy) {
      status = "outage";
    } else if (hasDegraded) {
      status = "degraded";
    }

    return {
      name: health.app?.name || "Unknown Service",
      status,
      health,
      responseTime,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      name: "Unknown Service",
      status: "outage",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
      lastChecked: new Date().toISOString()
    };
  }
};

// Fetch Sunbird VA API Health
export const fetchSunbirdVAHealth = async (): Promise<ServiceHealth> => {
  return fetchHealthStatus("https://prodaskvistaar.mahapocra.gov.in/api/health");
};

// Users API - Updated to match actual backend controller
export const fetchUsers = async (params: UserPaginationParams = {}): Promise<PaginatedResponse<User>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
  startDate,
  endDate,
  sortKey,
  sortDirection
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || '',
      startDate: startDate || '',
  endDate: endDate || '',
  // Map client sortKey to server sortBy param name
  sortBy: sortKey || '',
  sortDirection: sortDirection || ''
    });

  console.log('Fetching users with URL:', `${SERVER_URL}/users?${queryParams}`);

  // Add a timeout to prevent extremely long waits
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const response = await fetch(`${SERVER_URL}/users?${queryParams}`, { signal: controller.signal });
  clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: UsersAPIResponse = await response.json();
    
    console.log('Users API response:', result);
    
    if (!result.success) {
      throw new Error('Failed to fetch users');
    }

    // Transform backend response to match our User interface
    const transformedData: User[] = result.data.map((item: UserResponse) => ({
      id: item.id,
      username: item.username,
      sessions: item.sessions,
      latestSession: item.latestSession,
      totalQuestions: item.totalQuestions,
      totalSessions: item.sessions,
      firstActivity: item.firstSession,
      lastActivity: item.lastActivity,
      sessionId: item.sessionId,
      feedbackCount: item.feedbackCount,
      likes: item.likes,
      dislikes: item.dislikes
    }));

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    // Normalize abort error message for the UI
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching users');
    }
    throw error;
  }
};

export const fetchUserByUsername = async (username: string, params: PaginationParams = {}): Promise<User | null> => {
  try {
    const { startDate, endDate } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const response = await fetch(`${SERVER_URL}/users/name/${username}?${queryParams}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return null;
    }

    // Transform backend response to match our User interface
    const userData: UserResponse = result.data;
    return {
      id: userData.id,
      username: userData.username,
      sessions: userData.sessions,
      latestSession: userData.latestSession,
      totalQuestions: userData.totalQuestions,
      totalSessions: userData.sessions,
      firstActivity: userData.firstSession,
      lastActivity: userData.lastActivity,
      feedbackCount: userData.feedbackCount,
      likes: userData.likes,
      dislikes: userData.dislikes
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
};

export const fetchUserStats = async (params: PaginationParams = {}): Promise<UserStatsResponse> => {
  try {
    const { startDate, endDate } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const url = `${SERVER_URL}/users/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching user stats with URL:', url);

    const response = await fetch(url);
    
    console.log('User stats response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('User stats API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Raw user stats API response:', result);
    
    if (!result.success) {
      console.error('API returned success: false', result);
      throw new Error('Failed to fetch user stats');
    }

    console.log('User stats data:', result.data);
    return {
      ...result.data,
      newUsers: result.data.newUsers || 0,
      returningUsers: result.data.returningUsers || 0,
      activeCumulative: result.data.activeCumulative || 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return default values on error
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
      avgSessionDuration: 0,
      newUsers: 0,
      returningUsers: 0,
      activeCumulative: 0,
      dailyActivity: []
    };
  }
};

// Sessions API - Updated to match actual backend controller
export const fetchSessions = async (params: SessionPaginationParams = {}): Promise<PaginatedResponse<Session>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || ''
    });

    console.log('Fetching sessions with URL:', `${SERVER_URL}/sessions?${queryParams}`);

    const response = await fetch(`${SERVER_URL}/sessions?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: SessionsAPIResponse = await response.json();
    
    console.log('Sessions API response:', result);
    
    if (!result.success) {
      throw new Error('Failed to fetch sessions');
    }

    // Transform backend response to match our Session interface
    const transformedData: Session[] = result.data.map((item: SessionResponse) => ({
      sessionId: item.sessionId,
      username: item.username,
      questionCount: item.questionCount,
      sessionTime: item.sessionTime,
      userId: item.username, // Use username as userId fallback
      startTime: item.sessionTime,
      endTime: item.sessionTime,
      totalQuestions: item.questionCount,
      totalFeedback: 0, // Would need separate call to get this
      totalErrors: 0 // Would need separate call to get this
    }));

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const fetchSessionById = async (sessionId: string, params: PaginationParams = {}): Promise<SessionDetail | null> => {
  try {
    const { startDate, endDate } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || ''
    });

    console.log('Fetching session details for:', sessionId);
    
    const response = await fetch(`${SERVER_URL}/sessions/${sessionId}?${queryParams}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching session by ID:', error);
    return null;
  }
};

export const fetchSessionsByUserId = async (userId: string, params: SessionPaginationParams = {}): Promise<PaginatedResponse<Session>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      startDate,
      endDate
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const response = await fetch(`${SERVER_URL}/sessions/user/${userId}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: SessionsAPIResponse = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch sessions by user ID');
    }

    // Transform backend response to match our Session interface
    const transformedData: Session[] = result.data.map((item: SessionResponse) => ({
      sessionId: item.sessionId,
      username: item.username,
      questionCount: item.questionCount,
      sessionTime: item.sessionTime,
      userId: userId,
      startTime: item.sessionTime,
      endTime: item.sessionTime,
      totalQuestions: item.questionCount,
      totalFeedback: 0,
      totalErrors: 0
    }));

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching sessions by user ID:', error);
    throw error;
  }
};

// Get session statistics
export const fetchBasicSessionStats = async (params: PaginationParams = {}): Promise<{
  totalSessions: number;
  totalQuestions: number;
  totalUsers: number;
}> => {
  try {
    const { startDate, endDate } = params;
    
    // Fetch a large sample to get statistics
    const queryParams = buildQueryParams({
      page: 1,
      limit: 10000, // Large limit to get comprehensive stats
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const response = await fetch(`${SERVER_URL}/sessions?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: SessionsAPIResponse = await response.json();
    
    const totalQuestions = result.data.reduce((sum, session) => sum + session.questionCount, 0);
    const uniqueUsers = new Set(result.data.map(session => session.username)).size;

    return {
      totalSessions: result.pagination.totalItems,
      totalQuestions,
      totalUsers: uniqueUsers
    };
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalUsers: 0
    };
  }
};

// Questions API - Updated to match actual backend controller
export const fetchQuestions = async (params: QuestionPaginationParams = {}): Promise<PaginatedResponse<Question>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      userId,
      sessionId
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || '',
      userId: userId || '',
      sessionId: sessionId || ''
    });

    console.log('Fetching questions with URL:', `${SERVER_URL}/questions?${queryParams}`);

    const response = await fetch(`${SERVER_URL}/questions?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: QuestionsAPIResponse = await response.json();
    
    console.log('Questions API response:', result);
    
    if (!result.success) {
      throw new Error('Failed to fetch questions');
    }

    // Transform backend response to match our PaginatedResponse interface
    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const fetchQuestionById = async (id: string): Promise<Question | null> => {
  try {
    const response = await fetch(`${SERVER_URL}/questions/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      return null;
    }
 console.log("result.data",result.data)
    return result.data;
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    return null;
  }
};

export const fetchQuestionsByUserId = async (userId: string, params: QuestionPaginationParams = {}): Promise<PaginatedResponse<Question>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      startDate,
      endDate
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const response = await fetch(`${SERVER_URL}/questions/user/${userId}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: QuestionsAPIResponse = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch questions by user ID');
    }

    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching questions by user ID:', error);
    throw error;
  }
};

// Feedback API - Updated to match actual backend controller
export const fetchFeedback = async (params: PaginationParams = {}): Promise<PaginatedResponse<Feedback>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || ''
    });

    console.log('Fetching feedback with URL:', `${SERVER_URL}/feedback?${queryParams}`);

    const response = await fetch(`${SERVER_URL}/feedback?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: FeedbackAPIResponse = await response.json();
    
    console.log('Feedback API response:', result);

    // Transform the API response to match the Feedback interface
    const transformedData: Feedback[] = result.data.map((item: FeedbackSessionAPIResponse) => ({
      id: item.id,
      date: item.date || item.timestamp || new Date().toISOString(),
      question: item.question || "",
      answer: item.answer || "",
      user: item.user || "Unknown",
      rating: item.rating === "like" ? "like" : "dislike",
      feedback: item.feedback || "",
      sessionId: item.sessionId || "",
      userId: item.user || ""
    }));

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

export const fetchFeedbackById = async (id: string): Promise<Feedback | null> => {
  try {
    const response = await fetch(`${SERVER_URL}/feedback/id/${id}`);
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    
    // The getFeedbackByid controller returns an array
    if (!result || !Array.isArray(result) || result.length === 0) {
      return null;
    }

    const feedbackData = result[0];
    
    return {
      id: feedbackData.id || id,
      date: feedbackData.created_at || new Date().toISOString(),
      question: feedbackData.questiontext || "",
      answer: feedbackData.answertext || "",
      user: feedbackData.user_id || "Unknown",
      rating: feedbackData.feedbacktype === "like" ? "like" : "dislike",
      feedback: feedbackData.feedbacktext || "",
      sessionId: feedbackData.session_id || "",
      userId: feedbackData.user_id || ""
    };
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    return null;
  }
};

// Get feedback statistics (total likes/dislikes)
export const fetchFeedbackStats = async (params: PaginationParams = {}): Promise<{
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
}> => {
  try {
    const { startDate, endDate } = params;
    
    // Use the regular feedback endpoint with minimal data (just 1 item) to get pagination stats
    const queryParams = buildQueryParams({
      page: 1,
      limit: 1, // We only need pagination info, not the actual data
      startDate: startDate || '',
      endDate: endDate || ''
    });

    console.log('Fetching feedback stats with URL:', `${SERVER_URL}/feedback?${queryParams}`);

    const response = await fetch(`${SERVER_URL}/feedback?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: FeedbackAPIResponse = await response.json();
    
    console.log('Feedback stats API response:', result);
    
    // Extract stats from pagination object
    const totalFeedback = result.pagination?.totalItems || 0;
    const totalLikes = result.pagination?.totalLikes || 0;
    const totalDislikes = result.pagination?.totalDislikes || 0;

    console.log('Extracted stats:', { totalFeedback, totalLikes, totalDislikes });

    return {
      totalFeedback,
      totalLikes,
      totalDislikes
    };
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return {
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0
    };
  }
};

// Get comprehensive session statistics
export const fetchSessionStats = async (params: PaginationParams = {}): Promise<{
  totalSessions: number;
  uniqueUsers: number;
  totalQuestions: number;
  avgQuestionsPerSession: number;
  avgSessionDuration: number;
  maxSessionDuration: number;
  minSessionDuration: number;
  dailyActivity: Array<{
    date: string;
    sessionsCount: number;
    uniqueUsersCount: number;
    questionsCount: number;
  }>;
  channelBreakdown: Array<{
    channel: string;
    sessionsCount: number;
    questionsCount: number;
  }>;
}> => {
  try {
    const { startDate, endDate, granularity } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || ''
    });

    const url = `${SERVER_URL}/sessions/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching session stats with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch session stats');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      totalQuestions: 0,
      avgQuestionsPerSession: 0,
      avgSessionDuration: 0,
      maxSessionDuration: 0,
      minSessionDuration: 0,
      dailyActivity: [],
      channelBreakdown: []
    };
  }
};

// Get comprehensive question statistics
export const fetchQuestionStats = async (params: PaginationParams = {}): Promise<{
  totalQuestions: number;
  uniqueUsers: number;
  uniqueSessions: number;
  uniqueChannels: number;
  avgQuestionLength: number;
  avgAnswerLength: number;
  dailyActivity: Array<{
    date: string;
    questionsCount: number;
    uniqueUsersCount: number;
    uniqueSessionsCount: number;
    avgQuestionLength: number;
    avgAnswerLength: number;
  }>;
  channelBreakdown: Array<{
    channel: string;
    questionsCount: number;
    uniqueUsers: number;
    uniqueSessions: number;
    avgQuestionLength: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    uniqueUsersCount: number;
    questionsCount: number;
  }>;
}> => {
  try {
    const { startDate, endDate, granularity } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || ''
    });

    const url = `${SERVER_URL}/questions/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching question stats with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch question stats');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return {
      totalQuestions: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
      uniqueChannels: 0,
      avgQuestionLength: 0,
      avgAnswerLength: 0,
      dailyActivity: [],
      channelBreakdown: [],
      hourlyDistribution: []
    };
  }
};

// Get comprehensive feedback statistics (new endpoint)
export const fetchComprehensiveFeedbackStats = async (params: PaginationParams = {}): Promise<{
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
  uniqueUsers: number;
  uniqueSessions: number;
  satisfactionRate: number;
  avgFeedbackLength: number;
  dailyActivity: Array<{
    date: string;
    feedbackCount: number;
    likesCount: number;
    dislikesCount: number;
    uniqueUsersCount: number;
    satisfactionRate: number;
  }>;
  channelBreakdown: Array<{
    channel: string;
    feedbackCount: number;
    likesCount: number;
    dislikesCount: number;
    uniqueUsers: number;
    satisfactionRate: number;
  }>;
  topFeedbackUsers: Array<{
    userId: string;
    feedbackCount: number;
    likesCount: number;
    dislikesCount: number;
  }>;
}> => {
  try {
    const { startDate, endDate, granularity } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || ''
    });

    const url = `${SERVER_URL}/feedback/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching comprehensive feedback stats with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch comprehensive feedback stats');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching comprehensive feedback stats:', error);
    return {
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
      satisfactionRate: 0,
      avgFeedbackLength: 0,
      dailyActivity: [],
      channelBreakdown: [],
      topFeedbackUsers: []
    };
  }
};

// Get comprehensive dashboard statistics
export const fetchDashboardStats = async (params: PaginationParams = {}): Promise<{
  totalUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
  satisfactionRate: number;
  engagementRate: number;
  avgQuestionsPerUser: number;
  avgQuestionsPerSession: number;
  avgSessionDuration: number;
  avgQuestionLength: number;
  avgAnswerLength: number;
  uniqueChannels: number;
  recentTrends: Array<{
    date: string;
    users: number;
    sessions: number;
    questions: number;
  }>;
  topChannels: Array<{
    channel: string;
    users: number;
    sessions: number;
    questions: number;
  }>;
}> => {
  try {
    const { startDate, endDate, granularity } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || ''
    });

    const url = `${SERVER_URL}/dashboard/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching dashboard stats with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
      satisfactionRate: 0,
      engagementRate: 0,
      avgQuestionsPerUser: 0,
      avgQuestionsPerSession: 0,
      avgSessionDuration: 0,
      avgQuestionLength: 0,
      avgAnswerLength: 0,
      uniqueChannels: 0,
      recentTrends: [],
      topChannels: []
    };
  }
};

// Legacy support functions (these will be deprecated)
export const fetchDailyMetrics = async (): Promise<DailyMetric[]> => {
  // This would be replaced with a proper API call
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(350);
  return dailyMetrics; // Return empty array until proper endpoint is implemented
};

export const fetchTranslation = async (feedbackId: string): Promise<Translation | undefined> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(200);
  return undefined; // Return undefined until proper endpoint is implemented
};

export const fetchSessionEvents = async (sessionId: string): Promise<SessionEvent[]> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(500);
  // Mock timeline data with clips and sample data
  return [
    {
      type: "Login",
      timestamp: "2025-04-28T09:00:00Z",
      sampleData: "User login from Chrome/MacOS",
    },
    {
      type: "Asked Question Voice",
      timestamp: "2025-04-28T09:01:00Z",
      sampleData: "Voice input detected (5 seconds)",
      clip: "voice_input_001.mp3",
    },
    {
      type: "Voice Clip",
      timestamp: "2025-04-28T09:01:05Z",
      sampleData: "How do I improve my presentation skills?",
      clip: "processed_voice_001.mp3",
    },
    {
      type: "Transcribe Data from Voice",
      timestamp: "2025-04-28T09:01:10Z",
      sampleData: "Text: 'How do I improve my presentation skills?'",
    },
    {
      type: "Translation Data",
      timestamp: "2025-04-28T09:01:15Z",
      sampleData: {
        sourceLanguage: "en",
        translatedText: "Comment puis-je améliorer mes compétences en présentation?",
        targetLanguage: "fr",
      },
    },
    {
      type: "Answer From AI",
      timestamp: "2025-04-28T09:01:30Z",
      sampleData: "Here are some key tips to improve your presentation skills: 1. Practice regularly, 2. Know your audience, 3. Use storytelling techniques...",
      clip: "ai_response_001.mp3",
    },
    {
      type: "User Reaction",
      timestamp: "2025-04-28T09:01:45Z",
      sampleData: { reaction: "helpful", rating: 5 },
    },
    {
      type: "Suggested Questions",
      timestamp: "2025-04-28T09:02:00Z",
      sampleData: [
        "How can I handle presentation anxiety?",
        "What are good presentation structures?",
        "How to engage the audience better?",
      ],
    },
  ];
};

// Deprecated functions for backward compatibility
export const generateUserReport = async (
  userId?: string, 
  startDate?: string, 
  endDate?: string
): Promise<UserReport[]> => {
  // This should use the new API functions
  console.warn('generateUserReport is deprecated. Use fetchUsers with filters instead.');
  return [];
};

export const generateSessionReport = async (
  username?: string,
  startDate?: string,
  endDate?: string
): Promise<Session[]> => {
  // This should use the new API functions
  console.warn('generateSessionReport is deprecated. Use fetchSessions with filters instead.');
  return [];
};

export const generateQuestionsReport = async (
  paginationParams: { page: number; pageSize: number },
  userId?: string,
  sessionId?: string,
  startDate?: string,
  endDate?: string,
  searchText?: string
): Promise<PaginatedResponse<Question>> => {
  // This should use the new fetchQuestions function
  console.warn('generateQuestionsReport is deprecated. Use fetchQuestions with filters instead.');
  return fetchQuestions({
    page: paginationParams.page,
    limit: paginationParams.pageSize,
    userId,
    sessionId,
    startDate,
    endDate,
    search: searchText
  });
};

// Legacy functions that aren't in the new API
export const fetchQuestionsBySessionId = async (sessionId: string): Promise<Question[]> => {
  try {
    console.log('Fetching questions for session:', sessionId);
    
    const response = await fetch(`${SERVER_URL}/questions/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch questions by session ID');
    }

    // Handle case where result.data might not exist
    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Questions API returned invalid data format for session:', sessionId);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching questions by session ID:', error);
    throw error;
  }
};

export const fetchFeedbackBySessionId = async (sessionId: string): Promise<Feedback[]> => {
  try {
    console.log('Fetching feedback for session:', sessionId);
    
    const response = await fetch(`${SERVER_URL}/feedback/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // The backend returns data in FeedbackAPIResponse format with pagination
    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Feedback API returned invalid data format for session:', sessionId);
      return [];
    }

    // Transform the API response to match the Feedback interface
    // The backend formatFeedbackData function returns data in this format:
    const transformedData: Feedback[] = result.data.map((item: FeedbackSessionAPIResponse) => ({
      id: item.id,
      date: item.date || item.timestamp || new Date().toISOString(),
      timestamp: item.timestamp,
      question: item.question || "",
      answer: item.answer || "",
      user: item.user || "Unknown",
      rating: item.rating === "like" ? "like" : "dislike",
      feedback: item.feedback || "",
      sessionId: item.sessionId || sessionId,
      userId: item.user || ""
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching feedback by session ID:', error);
    throw error;
  }
};

export const fetchErrorsBySessionId = async (sessionId: string): Promise<ErrorDetail[]> => {
  try {
    console.log('Fetching errors for session:', sessionId);
    
    const response = await fetch(`${SERVER_URL}/errors/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Errors API returned invalid data format for session:', sessionId);
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching errors by session ID:', error);
    // Return empty array instead of throwing to prevent breaking the session details page
    return [];
  }
};

/**
 * Fetch all pages of a paginated API and return the combined data array.
 * @param fetchFn The paginated fetch function (e.g., fetchQuestions)
 * @param params The filter params (page, limit, search, etc.)
 * @param maxLimit The max limit per page (default 1000)
 */
export async function fetchAllPages<T, P extends { page?: number; limit?: number }>(
  fetchFn: (params: P) => Promise<PaginatedResponse<T>>,
  params: P,
  maxLimit = 1000
): Promise<T[]> {
  const firstPage = await fetchFn({ ...params, page: 1, limit: maxLimit });
  let allData = [...firstPage.data];
  const totalPages = firstPage.totalPages;
  if (totalPages > 1) {
    const promises = [];
    for (let p = 2; p <= totalPages; p++) {
      promises.push(fetchFn({ ...params, page: p, limit: maxLimit }));
    }
    const results = await Promise.all(promises);
    results.forEach(r => {
      allData = allData.concat(r.data);
    });
  }
  return allData;
}

// Get questions graph data for time-series visualization
export const fetchQuestionsGraph = async (params: PaginationParams = {}): Promise<{
  data: Array<{
    date: string;
    timestamp: number;
    questionsCount: number;
    uniqueUsersCount: number;
    uniqueSessionsCount: number;
    uniqueChannelsCount: number;
    avgQuestionLength: number;
    avgAnswerLength: number;
    hour?: number;
    week?: string;
    month?: string;
  }>;
  metadata: {
    granularity: string;
    totalDataPoints: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    summary: {
      totalQuestions: number;
      totalUniqueUsers: number;
      avgQuestionsPerPeriod: number;
      peakActivity: {
        date: string | null;
        questionsCount: number;
      };
    };
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    granularity: string;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}> => {
  try {
    const { startDate, endDate, granularity, search } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || 'daily',
      search: search || ''
    });

    const url = `${SERVER_URL}/questions/graph${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching questions graph data with URL:', url);

    const response = await fetch(url);

    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch questions graph data');
    }

    return result;
  } catch (error) {
    console.error('Error fetching questions graph data:', error);
    return {
      data: [],
      metadata: {
        granularity: 'daily',
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null
        },
        summary: {
          totalQuestions: 0,
          totalUniqueUsers: 0,
          avgQuestionsPerPeriod: 0,
          peakActivity: {
            date: null,
            questionsCount: 0
          }
        }
      },
      filters: {
        search: '',
        startDate: null,
        endDate: null,
        granularity: 'daily',
        appliedStartTimestamp: null,
        appliedEndTimestamp: null
      }
    };
  }
};

// Get sessions graph data for time-series visualization
export const fetchSessionsGraph = async (params: PaginationParams = {}): Promise<{
  data: Array<{
    date: string;
    timestamp: number;
    sessionsCount: number;
    uniqueUsersCount: number;
    uniqueSessionIdsCount: number;
    questionsCount: number;
    feedbackCount: number;
    errorsCount: number;
    avgQuestionsPerSession: number;
    avgFeedbackPerSession: number;
    hour?: number;
    week?: string;
    month?: string;
  }>;
  metadata: {
    granularity: string;
    totalDataPoints: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    summary: {
      totalSessions: number;
      totalQuestions: number;
      totalUsers: number;
      avgSessionsPerPeriod: number;
      peakActivity: {
        date: string | null;
        sessionsCount: number;
      };
    };
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    granularity: string;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}> => {
  try {
    const { startDate, endDate, granularity, search } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || 'daily',
      search: search || ''
    });

    const url = `${SERVER_URL}/sessions/graph${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching sessions graph data with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch sessions graph data');
    }

    return result;
  } catch (error) {
    console.error('Error fetching sessions graph data:', error);
    return {
      data: [],
      metadata: {
        granularity: 'daily',
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null
        },
        summary: {
          totalSessions: 0,
          totalQuestions: 0,
          totalUsers: 0,
          avgSessionsPerPeriod: 0,
          peakActivity: {
            date: null,
            sessionsCount: 0
          }
        }
      },
      filters: {
        search: '',
        startDate: null,
        endDate: null,
        granularity: 'daily',
        appliedStartTimestamp: null,
        appliedEndTimestamp: null
      }
    };
  }
};

// Get feedback graph data for time-series visualization
export const fetchFeedbackGraph = async (params: PaginationParams = {}): Promise<{
  data: Array<{
    date: string;
    timestamp: number;
    feedbackCount: number;
    likesCount: number;
    dislikesCount: number;
    uniqueUsersCount: number;
    uniqueSessionsCount: number;
    uniqueChannelsCount: number;
    avgFeedbackLength: number;
    avgQuestionLength: number;
    avgAnswerLength: number;
    satisfactionRate: number;
    hour?: number;
    week?: string;
    month?: string;
  }>;
  metadata: {
    granularity: string;
    totalDataPoints: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    summary: {
      totalFeedback: number;
      totalLikes: number;
      totalDislikes: number;
      totalUniqueUsers: number;
      avgFeedbackPerPeriod: number;
      overallSatisfactionRate: number;
      peakActivity: {
        date: string | null;
        feedbackCount: number;
      };
    };
  };
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    granularity: string;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}> => {
  try {
    const { startDate, endDate, granularity, search } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || 'daily',
      search: search || ''
    });

    const url = `${SERVER_URL}/feedback/graph${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching feedback graph data with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch feedback graph data');
    }

    return result;
  } catch (error) {
    console.error('Error fetching feedback graph data:', error);
    return {
      data: [],
      metadata: {
        granularity: 'daily',
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null
        },
        summary: {
          totalFeedback: 0,
          totalLikes: 0,
          totalDislikes: 0,
          totalUniqueUsers: 0,
          avgFeedbackPerPeriod: 0,
          overallSatisfactionRate: 0,
          peakActivity: {
            date: null,
            feedbackCount: 0
          }
        }
      },
      filters: {
        search: '',
        startDate: null,
        endDate: null,
        granularity: 'daily',
        appliedStartTimestamp: null,
        appliedEndTimestamp: null
      }
    };
  }
};

// Error-related types
export interface ErrorDetail {
  id: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  userId?: string;
  sessionId?: string;
  questionId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestData?: unknown;
  userAgent?: string;
  ipAddress?: string;
  date: string;
  time: string;
  fullDate: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  errorCount: number;
  lastOccurrence?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface ErrorPaginationParams extends PaginationParams {
  errorType?: string;
}

export interface ErrorAPIResponse {
  data: ErrorDetail[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  total: number;
}

export interface ErrorStatsResponse {
  totalErrors: number;
  unresolvedErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  avgErrorCount: number;
}

export interface ErrorGraphResponse {
  data: Array<{
    date: string;
    errorCount: number;
    criticalCount: number;
    unresolvedCount: number;
  }>;
}

// Error API Functions

// Get all errors with pagination
export const fetchErrors = async (params: ErrorPaginationParams = {}): Promise<PaginatedResponse<ErrorDetail>> => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate, errorType = '' } = params;
    
    const queryParams = buildQueryParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || '',
      errorType: errorType || ''
    });

    const url = `${SERVER_URL}/errors${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching errors with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ErrorAPIResponse = await response.json();
    
    console.log('Error API response:', result);
    
    return {
      data: result.data,
      total: result.total,
      page: result.pagination.currentPage,
      pageSize: limit,
      totalPages: result.pagination.totalPages
    };
  } catch (error) {
    console.error('Error fetching errors:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    };
  }
};

// Get error by ID
export const fetchErrorById = async (id: string): Promise<ErrorDetail | null> => {
  try {
    const url = `${SERVER_URL}/errors/id/${id}`;
    console.log('Fetching error by ID with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching error by ID:', error);
    return null;
  }
};

// Get error statistics
export const fetchErrorStats = async (params: PaginationParams = {}): Promise<ErrorStatsResponse> => {
  try {
    const { search = '', startDate, endDate } = params;
    
    const queryParams = buildQueryParams({
      search: search || '',
      startDate: startDate || '',
      endDate: endDate || ''
    });

    const url = `${SERVER_URL}/errors/stats${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching error stats with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ErrorStatsResponse = await response.json();
    
    console.log('Error stats response:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching error statistics:', error);
    return {
      totalErrors: 0,
      unresolvedErrors: 0,
      resolvedErrors: 0,
      criticalErrors: 0,
      avgErrorCount: 0
    };
  }
};

// Get error graph data for time-series visualization
export const fetchErrorGraph = async (params: PaginationParams = {}): Promise<ErrorGraphResponse> => {
  try {
    const { startDate, endDate, granularity = 'day' } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || 'day'
    });

    const url = `${SERVER_URL}/errors/graph${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching error graph data with URL:', url);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ErrorGraphResponse = await response.json();
    
    console.log('Error graph response:', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching error graph data:', error);
    return {
      data: []
    };
  }
};

export const fetchUsersGraph = async (params: PaginationParams = {}): Promise<UsersGraphResponse> => {
  try {
    const { startDate, endDate, granularity, search } = params;
    
    const queryParams = buildQueryParams({
      startDate: startDate || '',
      endDate: endDate || '',
      granularity: granularity || 'daily',
      search: search || ''
    });

    const url = `${SERVER_URL}/userss/graph-user${queryParams ? `?${queryParams}` : ''}`;
    console.log('Fetching users graph data with URL:', url);

    const response = await fetch(url);

    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch users graph data');
    }

    return result;
  } catch (error) {
    console.error('Error fetching users graph data:', error);
    return {
      data: [],
      metadata: {
        granularity: 'daily',
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null
        },
        summary: {
          totalUniqueUsers: 0,
          peakActivity: {
            date: null,
            uniqueUsersCount: 0
          }
        }
      },
      filters: {
        search: '',
        startDate: null,
        endDate: null,
        granularity: 'daily',
        appliedStartTimestamp: null,
        appliedEndTimestamp: null
      }
    };
  }
};
