// Device type for /devices endpoint
export interface Device {
  fingerprint_id: string;
  browser_code: string;
  browser_name: string;
  browser_version: string;
  device_code: string;
  device_name: string;
  device_model: string;
  os_code: string;
  os_name: string;
  os_version: string;
  first_seen_at: string;
  last_seen_at: string;
}

// Fetch devices from /devices endpoint
export const fetchDevices = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Device>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
    } = params;
    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
    });
    const response = await fetch(`${SERVER_URL}/devices?${queryParams}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error("Failed to fetch devices");
    }
    // The backend returns { data, pagination: { ... } }
    return {
      data: result.data,
      total: result.pagination?.total || 0,
      page: result.pagination?.currentPage || page,
      pageSize: result.pagination?.itemsPerPage || limit,
      totalPages: result.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};
import React from "react";
import { API_CONFIG } from "../config/environment";
import dailyMetrics from "../data/dailyMetrics.json";

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

export interface AppDownloadsDataPoint {
  date: string;
  platform: "ios" | "android";
  version: string;
  installs: number;
  updatedAt: string;
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
  feedbackSource?: 'chat' | 'voice';
  channel?: string;
  [key: string]: unknown;
}

export type NotificationEventGroup =
  | "location"
  | "notification_api"
  | "notification_actions"
  | "notification_feedback"
  | "sessions";

export interface NotificationTelemetryEvent {
  id: string;
  source_log_id?: string;
  source_event_index?: number;
  eid?: string;
  uid?: string;
  fingerprint_id?: string;
  sid?: string;
  channel?: string;
  ets?: string | number;
  event_name: string;
  category: "location" | "notification" | "notification_feedback";
  event_time?: string;
  metadata?: Record<string, unknown>;
  notification_id?: string;
  action?: string;
  reason?: string;
  feedback?: string;
  status_code?: number;
  success?: boolean;
  response?: unknown;
  response_count?: number;
  created_at?: string;
}

export interface NotificationTelemetrySummary {
  location_prompt_allowed?: string | number;
  location_prompt_denied?: string | number;
  location_browser_allowed?: string | number;
  location_browser_denied?: string | number;
  notification_api_calls?: string | number;
  notification_api_success?: string | number;
  total_notifications_returned?: string | number;
  notification_bell?: string | number;
  notification_opens?: string | number;
  mark_all_read?: string | number;
  feedback_yes?: string | number;
  feedback_no?: string | number;
  negative_feedback_submitted?: string | number;
  total_sessions?: string | number;
}

export interface NotificationTelemetrySession {
  sid: string;
  fingerprint_id?: string;
  session_time?: string;
  total_notifications_returned?: string | number;
  bell_clicks?: string | number;
  notification_opens?: string | number;
  like_count?: string | number;
  dislike_count?: string | number;
  negative_feedback_submitted?: string | number;
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
  feedbackSource?: 'chat' | 'voice';
  channel?: string;
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
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  granularity?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  feedbackSource?: string;
  feedbackType?: string;
  channel?: string;
  category?: string;
  eventGroup?: string;
}

export interface UserPaginationParams extends PaginationParams {
  username?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
}

export interface SessionPaginationParams extends PaginationParams {
  sessionId?: string;
  userId?: string;
  pagination?: boolean;
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
  totalLikes?: number;
  totalDislikes?: number;
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
  feedbackSource?: string;
  channel?: string;
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
const buildQueryParams = (
  params: Record<string, string | number | boolean>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
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
  newUsers: number;
  returningUsers: number;
  activeCumulative: number;
}

// For users graph data (time series)
export interface UsersGraphDataPoint {
  date: string;
  hour?: number;
  newUsersCount?: number;
  returningUsersCount?: number;
  uniqueUsersCount?: number;
  timestamp?: number;
  [key: string]: string | number | undefined;
}

export interface UsersGraphResponse {
  data: UsersGraphDataPoint[];
  metadata: {
    granularity: string;
    totalDataPoints: number;
    dateRange: { start: string | null; end: string | null };
    summary: {
      totalNewUsers?: number;
      totalReturningUsers?: number;
      totalUniqueUsers?: number;
      peakNewUsersActivity?: { date: string | null; newUsers: number };
      peakReturningUsersActivity?: {
        date: string | null;
        returningUsers: number;
      };
      peakActivity?: { date: string | null; uniqueUsersCount: number };
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
export const fetchHealthStatus = async (
  url: string,
): Promise<ServiceHealth> => {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
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
    const hasUnhealthy = dependencyStatuses.some(
      (dep) => dep.status === "unhealthy",
    );
    const hasDegraded = dependencyStatuses.some(
      (dep) => dep.status === "degraded",
    );

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
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      name: "Unknown Service",
      status: "outage",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  }
};

// Fetch Sunbird VA API Health
export const fetchSunbirdVAHealth = async (): Promise<ServiceHealth> => {
  return fetchHealthStatus(
    "https://prodaskvistaar.mahapocra.gov.in/api/health",
  );
};

// Users API - Updated to match actual backend controller
export const fetchUsers = async (
  params: UserPaginationParams = {},
): Promise<PaginatedResponse<User>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortKey,
      sortDirection,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      // Map client sortKey to server sortBy param name
      sortBy: sortKey || "",
      sortDirection: sortDirection || "",
    });

    console.log(
      "Fetching users with URL:",
      `${SERVER_URL}/users?${queryParams}`,
    );

    // Add a timeout to prevent extremely long waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${SERVER_URL}/users?${queryParams}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: UsersAPIResponse = await response.json();

    console.log("Users API response:", result);

    if (!result.success) {
      throw new Error("Failed to fetch users");
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
      dislikes: item.dislikes,
    }));

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    // Normalize abort error message for the UI
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while fetching users");
    }
    throw error;
  }
};

export const fetchUserByUsername = async (
  username: string,
  params: PaginationParams = {},
): Promise<User | null> => {
  try {
    const { startDate, endDate } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const response = await fetch(
      `${SERVER_URL}/users/name/${username}?${queryParams}`,
    );

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
      dislikes: userData.dislikes,
    };
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return null;
  }
};

export const fetchUserStats = async (
  params: PaginationParams = {},
): Promise<UserStatsResponse> => {
  try {
    const { startDate, endDate } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const url = `${SERVER_URL}/users/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching user stats with URL:", url);

    const response = await fetch(url);

    console.log("User stats response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("User stats API error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("Raw user stats API response:", result);

    if (!result.success) {
      console.error("API returned success: false", result);
      throw new Error("Failed to fetch user stats");
    }

    console.log("User stats data:", result.data);
    return {
      ...result.data,
      newUsers: result.data.newUsers || 0,
      returningUsers: result.data.returningUsers || 0,
      activeCumulative: result.data.activeCumulative || 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    // Return default values on error
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
      newUsers: 0,
      returningUsers: 0,
      activeCumulative: 0,
    };
  }
};

// Sessions API - Updated to match actual backend controller
export const fetchSessions = async (
  params: SessionPaginationParams = {},
): Promise<PaginatedResponse<Session>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
      ...(params.pagination === false ? { pagination: false } : {}),
    });

    console.log(
      "Fetching sessions with URL:",
      `${SERVER_URL}/sessions?${queryParams}`,
    );

    const response = await fetch(`${SERVER_URL}/sessions?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SessionsAPIResponse = await response.json();

    console.log("Sessions API response:", result);

    if (!result.success) {
      throw new Error("Failed to fetch sessions");
    }

    // Transform backend response to match our Session interface
    const transformedData: Session[] = result.data.map(
      (item: SessionResponse) => ({
        sessionId: item.sessionId,
        username: item.username,
        questionCount: item.questionCount,
        sessionTime: item.sessionTime,
        userId: item.username, // Use username as userId fallback
        startTime: item.sessionTime,
        endTime: item.sessionTime,
        totalQuestions: item.questionCount,
        totalFeedback: 0, // Would need separate call to get this
        totalErrors: 0, // Would need separate call to get this
      }),
    );

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

export const fetchSessionById = async (
  sessionId: string,
  params: PaginationParams = {},
): Promise<SessionDetail | null> => {
  try {
    const { startDate, endDate } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    console.log("Fetching session details for:", sessionId);

    const response = await fetch(
      `${SERVER_URL}/sessions/${sessionId}?${queryParams}`,
    );

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
    console.error("Error fetching session by ID:", error);
    return null;
  }
};

export const fetchSessionsByUserId = async (
  userId: string,
  params: SessionPaginationParams = {},
): Promise<PaginatedResponse<Session>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      startDate,
      endDate,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const response = await fetch(
      `${SERVER_URL}/sessions/user/${userId}?${queryParams}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SessionsAPIResponse = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch sessions by user ID");
    }

    // Transform backend response to match our Session interface
    const transformedData: Session[] = result.data.map(
      (item: SessionResponse) => ({
        sessionId: item.sessionId,
        username: item.username,
        questionCount: item.questionCount,
        sessionTime: item.sessionTime,
        userId: userId,
        startTime: item.sessionTime,
        endTime: item.sessionTime,
        totalQuestions: item.questionCount,
        totalFeedback: 0,
        totalErrors: 0,
      }),
    );

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching sessions by user ID:", error);
    throw error;
  }
};

// Get session statistics
export const fetchBasicSessionStats = async (
  params: PaginationParams = {},
): Promise<{
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
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const response = await fetch(`${SERVER_URL}/sessions?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SessionsAPIResponse = await response.json();

    const totalQuestions = result.data.reduce(
      (sum, session) => sum + session.questionCount,
      0,
    );
    const uniqueUsers = new Set(result.data.map((session) => session.username))
      .size;

    return {
      totalSessions: result.pagination.totalItems,
      totalQuestions,
      totalUsers: uniqueUsers,
    };
  } catch (error) {
    console.error("Error fetching session stats:", error);
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalUsers: 0,
    };
  }
};

// Questions API - Updated to match actual backend controller
export const fetchQuestions = async (
  params: QuestionPaginationParams = {},
): Promise<PaginatedResponse<Question>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      userId,
      sessionId,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      userId: userId || "",
      sessionId: sessionId || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
    });

    console.log(
      "Fetching questions with URL:",
      `${SERVER_URL}/questions?${queryParams}`,
    );

    const response = await fetch(`${SERVER_URL}/questions?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: QuestionsAPIResponse = await response.json();

    console.log("Questions API response:", result);

    if (!result.success) {
      throw new Error("Failed to fetch questions");
    }

    // Transform backend response to match our PaginatedResponse interface
    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const fetchQuestionById = async (
  id: string,
): Promise<Question | null> => {
  try {
    const response = await fetch(`${SERVER_URL}/questions/${id}`);
    const result = await response.json();

    if (!result.success) {
      return null;
    }
    console.log("result.data", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    return null;
  }
};

export const fetchQuestionsByUserId = async (
  userId: string,
  params: QuestionPaginationParams = {},
): Promise<PaginatedResponse<Question>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      startDate,
      endDate,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const response = await fetch(
      `${SERVER_URL}/questions/user/${userId}?${queryParams}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: QuestionsAPIResponse = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch questions by user ID");
    }

    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching questions by user ID:", error);
    throw error;
  }
};

// Feedback API - Updated to match actual backend controller
export const fetchFeedback = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Feedback>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      feedbackSource,
      feedbackType,
      channel,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
      feedbackSource: feedbackSource || "",
      feedbackType: feedbackType || "",
      channel: channel || "",
    });

    console.log(
      "Fetching feedback with URL:",
      `${SERVER_URL}/feedback?${queryParams}`,
    );

    const response = await fetch(`${SERVER_URL}/feedback?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: FeedbackAPIResponse = await response.json();

    console.log("Feedback API response:", result);

    // Transform the API response to match the Feedback interface
    const transformedData: Feedback[] = result.data.map(
      (item: FeedbackSessionAPIResponse) => ({
        id: item.id,
        date: item.date || item.timestamp || new Date().toISOString(),
        timestamp: item.timestamp,
        question: item.question || "",
        answer: item.answer || "",
        user: item.user || "Unknown",
        rating: item.rating === "like" ? "like" : "dislike",
        feedback: item.feedback || "",
        sessionId: item.sessionId || "",
        userId: item.user || "",
        feedbackSource: (item.feedbackSource as 'chat' | 'voice') || 'chat',
        channel: item.channel || "",
      }),
    );

    return {
      data: transformedData,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
      totalLikes: result.pagination.totalLikes,
      totalDislikes: result.pagination.totalDislikes,
    };
  } catch (error) {
    console.error("Error fetching feedback:", error);
    throw error;
  }
};

export const fetchFeedbackChannels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${SERVER_URL}/feedback/channels`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching feedback channels:", error);
    return [];
  }
};

export const fetchFeedbackById = async (
  id: string,
): Promise<Feedback | null> => {
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
      date: feedbackData.ets
        ? new Date(Number(feedbackData.ets)).toISOString()
        : feedbackData.created_at || new Date().toISOString(),
      question: feedbackData.questiontext || "",
      answer: feedbackData.answertext || "",
      user: feedbackData.user_id || "Unknown",
      rating: feedbackData.feedbacktype === "like" ? "like" : "dislike",
      feedback: feedbackData.feedbacktext || "",
      sessionId: feedbackData.session_id || "",
      userId: feedbackData.user_id || "",
      timestamp: feedbackData.ets ? String(feedbackData.ets) : undefined,
      feedbackSource: feedbackData.feedback_source || 'chat',
      channel: feedbackData.channel || "",
    };
  } catch (error) {
    console.error("Error fetching feedback by ID:", error);
    return null;
  }
};

// Get feedback statistics (total likes/dislikes)
export const fetchFeedbackStats = async (
  params: PaginationParams = {},
): Promise<{
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
      startDate: startDate || "",
      endDate: endDate || "",
    });

    console.log(
      "Fetching feedback stats with URL:",
      `${SERVER_URL}/feedback?${queryParams}`,
    );

    const response = await fetch(`${SERVER_URL}/feedback?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: FeedbackAPIResponse = await response.json();

    console.log("Feedback stats API response:", result);

    // Extract stats from pagination object
    const totalFeedback = result.pagination?.totalItems || 0;
    const totalLikes = result.pagination?.totalLikes || 0;
    const totalDislikes = result.pagination?.totalDislikes || 0;

    console.log("Extracted stats:", {
      totalFeedback,
      totalLikes,
      totalDislikes,
    });

    return {
      totalFeedback,
      totalLikes,
      totalDislikes,
    };
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return {
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
    };
  }
};

// Get comprehensive session statistics
export const fetchSessionStats = async (
  params: PaginationParams = {},
): Promise<{
  totalSessions: number;
}> => {
  try {
    const { startDate, endDate, granularity } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "",
    });

    const url = `${SERVER_URL}/sessions/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching session stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch session stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching session stats:", error);
    return {
      totalSessions: 0,
    };
  }
};

// Get comprehensive question statistics
export const fetchQuestionStats = async (
  params: PaginationParams = {},
): Promise<{
  totalQuestions: number;
}> => {
  try {
    const { startDate, endDate, granularity } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "",
    });

    const url = `${SERVER_URL}/questions/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching question stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch question stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return {
      totalQuestions: 0,
    };
  }
};

// Get comprehensive feedback statistics (new endpoint)
export const fetchComprehensiveFeedbackStats = async (
  params: PaginationParams = {},
): Promise<{
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
}> => {
  try {
    const { startDate, endDate, granularity } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "",
    });

    const url = `${SERVER_URL}/feedback/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching comprehensive feedback stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch comprehensive feedback stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching comprehensive feedback stats:", error);
    return {
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
    };
  }
};

export interface LangfuseToolNode {
  toolName: string;
  count: number;
}

export interface LangfuseCategoryNode {
  categoryKey: string;
  count: number;
  tools: LangfuseToolNode[];
}

export interface LangfuseQuestionTreeDay {
  reportDate: string;
  totalQuestions: number;
  questionsAgri: number;
  questionsNonAgri: number;
  agri: {
    categories: LangfuseCategoryNode[];
  };
  nonAgri: {
    categories: LangfuseCategoryNode[];
  };
}

// Get comprehensive dashboard statistics - OPTIMIZED
export const fetchDashboardStats = async (
  params: PaginationParams = {},
): Promise<{
  totalUsers: number;
  totalNewUsers: number;
  totalReturningUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
}> => {
  try {
    const { startDate, endDate, granularity } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "",
    });

    const url = `${SERVER_URL}/dashboard/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching dashboard stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch dashboard stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalUsers: 0,
      totalNewUsers: 0,
      totalReturningUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
    };
  }
};

// Get unified dashboard statistics (always Bharat Vistaar)
export const fetchDashboardStatsUnified = async (
  params: PaginationParams = {},
): Promise<{
  totalUsers: number;
  totalNewUsers: number;
  totalReturningUsers: number;
  totalSessions: number;
  totalQuestions: number;
  totalFeedback: number;
  totalLikes: number;
  totalDislikes: number;
}> => {
  try {
    const { startDate, endDate, granularity } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "",
    });

    const url = `${SERVER_URL}/dashboard/stats-unified${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching unified dashboard stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch unified dashboard stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching unified dashboard stats:", error);
    return {
      totalUsers: 0,
      totalNewUsers: 0,
      totalReturningUsers: 0,
      totalSessions: 0,
      totalQuestions: 0,
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
    };
  }
};

export const fetchAppDownloads = async (
  params: PaginationParams = {},
): Promise<AppDownloadsDataPoint[]> => {
  try {
    const { startDate, endDate } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const url = `${SERVER_URL}/dashboard/downloads${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching app downloads with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error("Failed to fetch app downloads");
    }

    return result.data.map((item: AppDownloadsDataPoint) => ({
      date: item.date,
      platform: item.platform,
      version: item.version,
      installs: Number(item.installs) || 0,
      updatedAt: item.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching app downloads:", error);
    return [];
  }
};

export const fetchNotifications = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<NotificationTelemetryEvent>> => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    startDate,
    endDate,
    eventGroup,
    sortBy,
    sortOrder,
  } = params;

  const queryParams = buildQueryParams({
    page,
    limit,
    startDate: startDate || "",
    endDate: endDate || "",
    eventGroup: eventGroup || "notification_api",
    sortBy: sortBy || "event_time",
    sortOrder: sortOrder || "desc",
  });

  const response = await fetch(`${SERVER_URL}/notifications?${queryParams}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error("Failed to fetch notification telemetry");
  }

  return {
    data: result.data || [],
    total: result.pagination?.total || 0,
    page: result.pagination?.currentPage || page,
    pageSize: result.pagination?.itemsPerPage || limit,
    totalPages: result.pagination?.totalPages || 1,
  };
};

export const fetchNotificationById = async (
  id: string,
): Promise<NotificationTelemetryEvent> => {
  const response = await fetch(`${SERVER_URL}/notifications/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error("Failed to fetch notification telemetry event");
  }

  return result.data;
};

export const fetchNotificationSummary = async (
  params: Pick<PaginationParams, "startDate" | "endDate"> = {},
): Promise<NotificationTelemetrySummary> => {
  const queryParams = buildQueryParams({
    startDate: params.startDate || "",
    endDate: params.endDate || "",
  });

  const response = await fetch(`${SERVER_URL}/notifications/summary?${queryParams}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error("Failed to fetch notification telemetry summary");
  }

  return result.data || {};
};

// Legacy support functions (these will be deprecated)
export const fetchDailyMetrics = async (): Promise<DailyMetric[]> => {
  // This would be replaced with a proper API call
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  await delay(350);
  return dailyMetrics; // Return empty array until proper endpoint is implemented
};

export const fetchTranslation = async (
  feedbackId: string,
): Promise<Translation | undefined> => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  await delay(200);
  return undefined; // Return undefined until proper endpoint is implemented
};

export const fetchSessionEvents = async (
  sessionId: string,
): Promise<SessionEvent[]> => {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
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
        translatedText:
          "Comment puis-je améliorer mes compétences en présentation?",
        targetLanguage: "fr",
      },
    },
    {
      type: "Answer From AI",
      timestamp: "2025-04-28T09:01:30Z",
      sampleData:
        "Here are some key tips to improve your presentation skills: 1. Practice regularly, 2. Know your audience, 3. Use storytelling techniques...",
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
  endDate?: string,
): Promise<UserReport[]> => {
  // This should use the new API functions
  console.warn(
    "generateUserReport is deprecated. Use fetchUsers with filters instead.",
  );
  return [];
};

export const generateSessionReport = async (
  username?: string,
  startDate?: string,
  endDate?: string,
): Promise<Session[]> => {
  // This should use the new API functions
  console.warn(
    "generateSessionReport is deprecated. Use fetchSessions with filters instead.",
  );
  return [];
};

export const fetchLangfuseQuestionsTree = async (
  params: PaginationParams = {},
): Promise<LangfuseQuestionTreeDay[]> => {
  try {
    const { startDate, endDate } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const url = `${SERVER_URL}/langfuse/questions${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching langfuse toolcall tree with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch langfuse toolcall tree");
    }

    return result.data || [];
  } catch (error) {
    console.error("Error fetching langfuse toolcall tree:", error);
    throw error;
  }
};

export const generateQuestionsReport = async (
  paginationParams: { page: number; pageSize: number },
  userId?: string,
  sessionId?: string,
  startDate?: string,
  endDate?: string,
  searchText?: string,
): Promise<PaginatedResponse<Question>> => {
  // This should use the new fetchQuestions function
  console.warn(
    "generateQuestionsReport is deprecated. Use fetchQuestions with filters instead.",
  );
  return fetchQuestions({
    page: paginationParams.page,
    limit: paginationParams.pageSize,
    userId,
    sessionId,
    startDate,
    endDate,
    search: searchText,
  });
};

// Legacy functions that aren't in the new API
export const fetchQuestionsBySessionId = async (
  sessionId: string,
): Promise<Question[]> => {
  try {
    console.log("Fetching questions for session:", sessionId);

    const response = await fetch(
      `${SERVER_URL}/questions/session/${sessionId}?pagination=false`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch questions by session ID");
    }

    // Handle case where result.data might not exist
    if (!result.data || !Array.isArray(result.data)) {
      console.warn(
        "Questions API returned invalid data format for session:",
        sessionId,
      );
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching questions by session ID:", error);
    throw error;
  }
};

export const fetchFeedbackBySessionId = async (
  sessionId: string,
): Promise<Feedback[]> => {
  try {
    console.log("Fetching feedback for session:", sessionId);

    const response = await fetch(`${SERVER_URL}/feedback/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // The backend returns data in FeedbackAPIResponse format with pagination
    if (!result.data || !Array.isArray(result.data)) {
      console.warn(
        "Feedback API returned invalid data format for session:",
        sessionId,
      );
      return [];
    }

    // Transform the API response to match the Feedback interface
    // The backend formatFeedbackData function returns data in this format:
    const transformedData: Feedback[] = result.data.map(
      (item: FeedbackSessionAPIResponse) => ({
        id: item.id,
        date: item.date || item.timestamp || new Date().toISOString(),
        timestamp: item.timestamp,
        question: item.question || "",
        answer: item.answer || "",
        user: item.user || "Unknown",
        rating: item.rating === "like" ? "like" : "dislike",
        feedback: item.feedback || "",
        sessionId: item.sessionId || sessionId,
        userId: item.user || "",
      }),
    );

    return transformedData;
  } catch (error) {
    console.error("Error fetching feedback by session ID:", error);
    throw error;
  }
};

export const fetchErrorsBySessionId = async (
  sessionId: string,
): Promise<ErrorDetail[]> => {
  try {
    console.log("Fetching errors for session:", sessionId);

    const response = await fetch(`${SERVER_URL}/errors/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      console.warn(
        "Errors API returned invalid data format for session:",
        sessionId,
      );
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching errors by session ID:", error);
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
export async function fetchAllPages<
  T,
  P extends { page?: number; limit?: number },
>(
  fetchFn: (params: P) => Promise<PaginatedResponse<T>>,
  params: P,
  maxLimit = 1000,
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
    results.forEach((r) => {
      allData = allData.concat(r.data);
    });
  }
  return allData;
}

// Get questions graph data for time-series visualization
export const fetchQuestionsGraph = async (
  params: PaginationParams = {},
): Promise<{
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
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "daily",
      search: search || "",
    });

    const url = `${SERVER_URL}/questions/graph${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching questions graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch questions graph data");
    }

    return result;
  } catch (error) {
    console.error("Error fetching questions graph data:", error);
    return {
      data: [],
      metadata: {
        granularity: "daily",
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null,
        },
        summary: {
          totalQuestions: 0,
          totalUniqueUsers: 0,
          avgQuestionsPerPeriod: 0,
          peakActivity: {
            date: null,
            questionsCount: 0,
          },
        },
      },
      filters: {
        search: "",
        startDate: null,
        endDate: null,
        granularity: "daily",
        appliedStartTimestamp: null,
        appliedEndTimestamp: null,
      },
    };
  }
};

// Get sessions graph data for time-series visualization
export const fetchSessionsGraph = async (
  params: PaginationParams = {},
): Promise<{
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
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "daily",
      search: search || "",
    });

    const url = `${SERVER_URL}/sessions/graph${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching sessions graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch sessions graph data");
    }

    return result;
  } catch (error) {
    console.error("Error fetching sessions graph data:", error);
    return {
      data: [],
      metadata: {
        granularity: "daily",
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null,
        },
        summary: {
          totalSessions: 0,
          totalQuestions: 0,
          totalUsers: 0,
          avgSessionsPerPeriod: 0,
          peakActivity: {
            date: null,
            sessionsCount: 0,
          },
        },
      },
      filters: {
        search: "",
        startDate: null,
        endDate: null,
        granularity: "daily",
        appliedStartTimestamp: null,
        appliedEndTimestamp: null,
      },
    };
  }
};

// Get feedback graph data for time-series visualization
export const fetchFeedbackGraph = async (
  params: PaginationParams = {},
): Promise<{
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
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "daily",
      search: search || "",
    });

    const url = `${SERVER_URL}/feedback/graph${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching feedback graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch feedback graph data");
    }

    return result;
  } catch (error) {
    console.error("Error fetching feedback graph data:", error);
    return {
      data: [],
      metadata: {
        granularity: "daily",
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null,
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
            feedbackCount: 0,
          },
        },
      },
      filters: {
        search: "",
        startDate: null,
        endDate: null,
        granularity: "daily",
        appliedStartTimestamp: null,
        appliedEndTimestamp: null,
      },
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
  uniqueUsers: number;
  uniqueSessions: number;
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
export const fetchErrors = async (
  params: ErrorPaginationParams = {},
): Promise<PaginatedResponse<ErrorDetail>> => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      startDate,
      endDate,
      errorType = "",
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      errorType: errorType || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
    });

    const url = `${SERVER_URL}/errors${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching errors with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ErrorAPIResponse = await response.json();

    console.log("Error API response:", result);

    return {
      data: result.data,
      total: result.total,
      page: result.pagination.currentPage,
      pageSize: limit,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching errors:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  }
};

// Get error by ID
export const fetchErrorById = async (
  id: string,
): Promise<ErrorDetail | null> => {
  try {
    const url = `${SERVER_URL}/errors/id/${id}`;
    console.log("Fetching error by ID with URL:", url);

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
    console.error("Error fetching error by ID:", error);
    return null;
  }
};

// Get error statistics
export const fetchErrorStats = async (
  params: PaginationParams = {},
): Promise<ErrorStatsResponse> => {
  try {
    const { search = "", startDate, endDate } = params;

    const queryParams = buildQueryParams({
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const url = `${SERVER_URL}/errors/stats${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching error stats with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ErrorStatsResponse = await response.json();

    console.log("Error stats response:", result);

    return result;
  } catch (error) {
    console.error("Error fetching error statistics:", error);
    return {
      totalErrors: 0,
      unresolvedErrors: 0,
      resolvedErrors: 0,
      criticalErrors: 0,
      avgErrorCount: 0,
      uniqueUsers: 0,
      uniqueSessions: 0,
    };
  }
};

// Get error graph data for time-series visualization
export const fetchErrorGraph = async (
  params: PaginationParams = {},
): Promise<ErrorGraphResponse> => {
  try {
    const { startDate, endDate, granularity = "day" } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "day",
    });

    const url = `${SERVER_URL}/errors/graph${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching error graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ErrorGraphResponse = await response.json();

    console.log("Error graph response:", result);

    return result;
  } catch (error) {
    console.error("Error fetching error graph data:", error);
    return {
      data: [],
    };
  }
};

export const fetchUsersGraph = async (
  params: PaginationParams = {},
): Promise<UsersGraphResponse> => {
  try {
    const { startDate, endDate, granularity, search } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "daily",
      search: search || "",
    });

    const url = `${SERVER_URL}/userss/graph-user${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching users graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch users graph data");
    }

    return result;
  } catch (error) {
    console.error("Error fetching users graph data:", error);
    return {
      data: [],
      metadata: {
        granularity: "daily",
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null,
        },
        summary: {
          totalUniqueUsers: 0,
          peakActivity: {
            date: null,
            uniqueUsersCount: 0,
          },
        },
      },
      filters: {
        search: "",
        startDate: null,
        endDate: null,
        granularity: "daily",
        appliedStartTimestamp: null,
        appliedEndTimestamp: null,
      },
    };
  }
};

export const fetchDevicesGraph = async (
  params: PaginationParams = {},
): Promise<UsersGraphResponse> => {
  try {
    const { startDate, endDate, granularity, search } = params;

    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
      granularity: granularity || "daily",
      search: search || "",
    });

    const url = `${SERVER_URL}/devices/graph${queryParams ? `?${queryParams}` : ""}`;
    console.log("Fetching devices graph data with URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch users graph data");
    }

    return result;
  } catch (error) {
    console.error("Error fetching users graph data:", error);
    return {
      data: [],
      metadata: {
        granularity: "daily",
        totalDataPoints: 0,
        dateRange: {
          start: null,
          end: null,
        },
        summary: {
          totalUniqueUsers: 0,
          peakActivity: {
            date: null,
            uniqueUsersCount: 0,
          },
        },
      },
      filters: {
        search: "",
        startDate: null,
        endDate: null,
        granularity: "daily",
        appliedStartTimestamp: null,
        appliedEndTimestamp: null,
      },
    };
  }
};

// ─── ASR / TTS ────────────────────────────────────────────────────────────────

export interface AsrRecord {
  id: number;
  sid: string;
  language: string;
  text: string;
  success: boolean;
  latencyMs: number;
  statusCode: number;
  errorCode: string | null;
  errorMessage: string | null;
  apiType: string;
  apiService: string;
  channel: string;
  createdAt: string | null;
  ets: number;
  [key: string]: unknown;
}

export interface TtsRecord {
  id: number;
  sid: string;
  language: string;
  text: string;
  success: boolean;
  latencyMs: number;
  statusCode: number;
  errorCode: string | null;
  errorMessage: string | null;
  apiType: string;
  apiService: string;
  channel: string;
  createdAt: string | null;
  ets: number;
  [key: string]: unknown;
}

export interface AsrTtsStats {
  totalCalls: number;
  successCount: number;
  successRate: number;
  avgLatency: number;
  maxLatency: number;
}

interface AsrTtsAPIResponse<T> {
  data: T[];
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
  stats: AsrTtsStats;
  filters: {
    search: string;
    startDate: string | null;
    endDate: string | null;
    appliedStartTimestamp: number | null;
    appliedEndTimestamp: number | null;
  };
}

export const fetchAsr = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<AsrRecord> & { stats: AsrTtsStats }> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
    });

    const response = await fetch(`${SERVER_URL}/asr?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AsrTtsAPIResponse<AsrRecord> = await response.json();

    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
      stats: result.stats,
    };
  } catch (error) {
    console.error("Error fetching ASR data:", error);
    throw error;
  }
};

export const fetchTts = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<TtsRecord> & { stats: AsrTtsStats }> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
    });

    const response = await fetch(`${SERVER_URL}/tts?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AsrTtsAPIResponse<TtsRecord> = await response.json();

    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
      stats: result.stats,
    };
  } catch (error) {
    console.error("Error fetching TTS data:", error);
    throw error;
  }
};

// ─── Calls API ─── (BharatVistaar call data from CSV ingestion) ───

export interface Call {
  id: number;
  interactionId: string;
  userId: string | null;
  userContactMasked: string | null;
  connectivityStatus: string | null;
  failureReason: string | null;
  endReason: string | null;
  durationInSeconds: number | null;
  startDatetime: string | null;
  endDatetime: string | null;
  languageName: string | null;
  currentLanguage: string | null;
  numMessages: number;
  averageAgentResponseTime: number | null;
  averageUserResponseTime: number | null;
  channelDirection: string | null;
  channelProvider: string | null;
  channelType: string | null;
  retryAttempt: number;
  isDebugCall: boolean;
  audioUrl: string | null;
  hasLogIssues: boolean;
  questionsCount: number;
  totalInteractions: number;
}

export interface CallMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  messageOrder: number;
}

export interface CallDetail {
  call: Call;
  messages: CallMessage[];
}

export interface CallsStatsResponse {
  totalCalls: number;
  totalUsers: number;
  totalQuestions: number;
  totalInteractions: number;
  avgDuration: number;
}

export interface CallsAPIResponse {
  success: boolean;
  data: Call[];
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
  };
}

// Fetch paginated calls list
export const fetchCalls = async (
  params: PaginationParams = {},
): Promise<PaginatedResponse<Call>> => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = params;

    const queryParams = buildQueryParams({
      page,
      limit,
      search: search || "",
      startDate: startDate || "",
      endDate: endDate || "",
      sortBy: sortBy || "",
      sortOrder: sortOrder || "",
    });

    const response = await fetch(`${SERVER_URL}/calls?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CallsAPIResponse = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch calls");
    }

    return {
      data: result.data,
      total: result.pagination.totalItems,
      page: result.pagination.currentPage,
      pageSize: result.pagination.itemsPerPage,
      totalPages: result.pagination.totalPages,
    };
  } catch (error) {
    console.error("Error fetching calls:", error);
    throw error;
  }
};

// Fetch single call by interaction_id
export const fetchCallById = async (
  callId: string,
): Promise<CallDetail | null> => {
  try {
    const response = await fetch(`${SERVER_URL}/calls/${callId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) return null;
    return result.data;
  } catch (error) {
    console.error("Error fetching call by ID:", error);
    return null;
  }
};

// Fetch aggregate stats for header cards
export const fetchCallsStats = async (
  params: PaginationParams = {},
): Promise<CallsStatsResponse> => {
  try {
    const { startDate, endDate } = params;
    const queryParams = buildQueryParams({
      startDate: startDate || "",
      endDate: endDate || "",
    });

    const response = await fetch(
      `${SERVER_URL}/calls/stats${queryParams ? `?${queryParams}` : ""}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error("Failed to fetch calls stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching calls stats:", error);
    return {
      totalCalls: 0,
      totalUsers: 0,
      totalQuestions: 0,
      totalInteractions: 0,
      avgDuration: 0,
    };
  }
};

// ── Beckn / External API observability (beckn_ext_events) ──────────────────
// Cards → GET /v1/beckn-ext/stats  (useCase = service_name)
// Table → GET /v1/beckn-ext        (useCase = service_name)

/** User-facing message for External API / beckn-ext HTTP failures */
export function getBecknExtFriendlyError(
  status?: number,
  serverMessage?: string,
): string {
  if (status === 401 || status === 403) {
    return "You don’t have permission to view external API data. Please sign in again or contact your admin.";
  }
  if (status === 404) {
    return "External API data is not available for this environment yet.";
  }
  if (status === 400) {
    return (
      serverMessage ||
      "The request could not be processed. Check your date range or filters and try again."
    );
  }
  if (status === 408 || status === 504) {
    return "The request took too long. Please try a shorter date range or try again.";
  }
  if (status === 502 || status === 503) {
    return "The analytics service is temporarily unavailable. Please try again in a few minutes.";
  }
  if (status === 500 || (status != null && status >= 500)) {
    return "We couldn’t load external API data right now due to a server issue. Please try again shortly.";
  }
  if (status != null && status > 0) {
    return (
      serverMessage ||
      "Something went wrong while loading external API data. Please try again."
    );
  }
  // Network / CORS / offline
  return "Unable to reach the server. Check your connection and try again.";
}

async function throwBecknExtHttpError(response: Response): Promise<never> {
  let serverMessage = "";
  try {
    const body = await response.json();
    serverMessage =
      (body && (body.message || body.error || body.details)) || "";
    if (typeof serverMessage !== "string") {
      serverMessage = "";
    }
  } catch {
    /* ignore body parse */
  }
  const err = new Error(
    getBecknExtFriendlyError(response.status, serverMessage || undefined),
  ) as Error & { status?: number };
  err.status = response.status;
  throw err;
}

export interface BecknExtUseCaseOption {
  useCase: string; // service_name
  count: number;
}

export interface BecknExtStats {
  totalExternalApiCalls: number;
  totalSuccess: number;
  totalErrors: number;
  maxLatencyMs: number;
  totalInvocations: number;
  successRate: number;
  useCases: BecknExtUseCaseOption[];
}

export interface BecknExtLog {
  id: string;
  sessionId: string;
  questionId: string;
  /** service_name — the use case */
  serviceName: string;
  useCase: string;
  routeName: string | null;
  channel: string | null;
  becknAction: string | null;
  becknDomain: string | null;
  requestPath: string | null;
  startEts: string | null;
  endEts: string | null;
  durationMs: number | null;
  flowStatus: string | null;
  flowSuccess: boolean | null;
  extApiService: string | null;
  extApiMethod: string | null;
  extApiUrl: string | null;
  extApiStatusCode: number | null;
  extApiLatencyMs: number | null;
  extApiSuccess: boolean | null;
  becknApiService: string | null;
  becknMethod: string | null;
  becknUrl: string | null;
  becknStatusCode: number | null;
  becknLatencyMs: number | null;
  becknSuccess: boolean | null;
  createdAt: string | null;
}

export interface BecknExtStatsParams {
  startDate?: string;
  endDate?: string;
  /** Filters on beckn_ext_events.service_name */
  useCase?: string;
}

export interface BecknExtListParams extends PaginationParams {
  /** Filters on beckn_ext_events.service_name */
  useCase?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includePayloads?: boolean;
}

const EMPTY_BECKN_EXT_STATS: BecknExtStats = {
  totalExternalApiCalls: 0,
  totalSuccess: 0,
  totalErrors: 0,
  maxLatencyMs: 0,
  totalInvocations: 0,
  successRate: 0,
  useCases: [],
};

export const fetchBecknExtStats = async (
  params: BecknExtStatsParams = {},
): Promise<BecknExtStats> => {
  try {
    const queryParams = buildQueryParams({
      startDate: params.startDate || "",
      endDate: params.endDate || "",
      useCase: params.useCase || "",
    });

    const response = await fetch(
      `${SERVER_URL}/beckn-ext/stats${queryParams ? `?${queryParams}` : ""}`,
    );

    if (!response.ok) {
      await throwBecknExtHttpError(response);
    }

    const result = await response.json();
    return {
      totalExternalApiCalls: Number(result.totalExternalApiCalls) || 0,
      totalSuccess: Number(result.totalSuccess) || 0,
      totalErrors: Number(result.totalErrors) || 0,
      maxLatencyMs: Number(result.maxLatencyMs) || 0,
      totalInvocations: Number(result.totalInvocations) || 0,
      successRate: Number(result.successRate) || 0,
      useCases: Array.isArray(result.useCases)
        ? result.useCases.map(
            (u: { useCase?: string; serviceName?: string; count?: number }) => ({
              useCase: String(u.useCase || u.serviceName || ""),
              count: Number(u.count) || 0,
            }),
          ).filter((u: BecknExtUseCaseOption) => u.useCase)
        : [],
    };
  } catch (error) {
    console.error("Error fetching beckn-ext stats:", error);
    if (error instanceof Error && error.message && !("status" in error)) {
      // Network / parse failures without HTTP status
      if (
        error.message.startsWith("HTTP") ||
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        throw new Error(getBecknExtFriendlyError());
      }
    }
    throw error;
  }
};

export interface BecknExtLifecycleStep {
  step: number;
  type: "flow_start" | "ext_api" | "beckn_network" | "flow_end" | string;
  label: string;
  description: string;
  success: boolean | null;
  timestamp: string | null;
  meta: Record<string, unknown>;
  requestPayload: unknown;
  responsePayload: unknown;
  errorMessage: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  method: string | null;
  endpointUrl: string | null;
}

export interface BecknExtLifecycle {
  id: string | null;
  sessionId: string;
  questionId: string;
  serviceName: string | null;
  routeName: string | null;
  channel: string | null;
  becknAction: string | null;
  becknDomain: string | null;
  becknTransactionId: string | null;
  becknMessageId: string | null;
  requestPath: string | null;
  summary: {
    overallSuccess: boolean;
    flowStatus: string | null;
    flowSuccess: boolean | null;
    durationMs: number | null;
    startEts: string | null;
    endEts: string | null;
    startEtsIst: string | null;
    endEtsIst: string | null;
    totalSteps: number;
    extApiSuccess: boolean | null;
    becknSuccess: boolean | null;
  };
  detail: BecknExtLog & {
    extApiRequest?: unknown;
    extApiResponse?: unknown;
    extApiError?: string | null;
    becknRequest?: unknown;
    becknResponse?: unknown;
    becknError?: string | null;
    flowError?: string | null;
  };
  steps: BecknExtLifecycleStep[];
}

export const fetchBecknExtLifecycle = async (params: {
  questionId: string;
  sessionId?: string;
  id?: string;
}): Promise<BecknExtLifecycle> => {
  const { questionId, sessionId, id } = params;
  if (!questionId && !id) {
    throw new Error("questionId is required");
  }

  const queryParams = buildQueryParams({
    sessionId: sessionId || "",
    id: id || "",
  });

  const pathId = encodeURIComponent(questionId || "unknown");
  const response = await fetch(
    `${SERVER_URL}/beckn-ext/lifecycle/${pathId}${queryParams ? `?${queryParams}` : ""}`,
  );

  if (!response.ok) {
    await throwBecknExtHttpError(response);
  }

  const result = await response.json();
  if (!result.data) {
    throw new Error(
      "We couldn’t load the API lifecycle details. Please try again.",
    );
  }
  return result.data as BecknExtLifecycle;
};

export const fetchBecknExtList = async (
  params: BecknExtListParams = {},
): Promise<PaginatedResponse<BecknExtLog>> => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    startDate,
    endDate,
    search,
    useCase,
    sortBy = "start_ets",
    sortOrder = "desc",
    includePayloads = false,
  } = params;

  try {
    const queryParams = buildQueryParams({
      page,
      limit,
      startDate: startDate || "",
      endDate: endDate || "",
      search: search || "",
      useCase: useCase || "",
      sortBy,
      sortOrder,
      includePayloads: includePayloads ? "true" : "",
    });

    const response = await fetch(`${SERVER_URL}/beckn-ext?${queryParams}`);

    if (!response.ok) {
      await throwBecknExtHttpError(response);
    }

    const result = await response.json();
    const rows: BecknExtLog[] = Array.isArray(result.data)
      ? result.data.map(
          (row: Record<string, unknown>): BecknExtLog => ({
            id: String(row.id ?? ""),
            sessionId: String(row.sessionId ?? ""),
            questionId: String(row.questionId ?? ""),
            serviceName: String(row.serviceName || row.useCase || ""),
            useCase: String(row.useCase || row.serviceName || ""),
            routeName: (row.routeName as string) ?? null,
            channel: (row.channel as string) ?? null,
            becknAction: (row.becknAction as string) ?? null,
            becknDomain: (row.becknDomain as string) ?? null,
            requestPath: (row.requestPath as string) ?? null,
            startEts: (row.startEts as string) ?? null,
            endEts: (row.endEts as string) ?? null,
            durationMs:
              row.durationMs != null ? Number(row.durationMs) : null,
            flowStatus: (row.flowStatus as string) ?? null,
            flowSuccess:
              typeof row.flowSuccess === "boolean" ? row.flowSuccess : null,
            extApiService: (row.extApiService as string) ?? null,
            extApiMethod: (row.extApiMethod as string) ?? null,
            extApiUrl: (row.extApiUrl as string) ?? null,
            extApiStatusCode:
              row.extApiStatusCode != null
                ? Number(row.extApiStatusCode)
                : null,
            extApiLatencyMs:
              row.extApiLatencyMs != null
                ? Number(row.extApiLatencyMs)
                : null,
            extApiSuccess:
              typeof row.extApiSuccess === "boolean"
                ? row.extApiSuccess
                : null,
            becknApiService: (row.becknApiService as string) ?? null,
            becknMethod: (row.becknMethod as string) ?? null,
            becknUrl: (row.becknUrl as string) ?? null,
            becknStatusCode:
              row.becknStatusCode != null
                ? Number(row.becknStatusCode)
                : null,
            becknLatencyMs:
              row.becknLatencyMs != null ? Number(row.becknLatencyMs) : null,
            becknSuccess:
              typeof row.becknSuccess === "boolean" ? row.becknSuccess : null,
            createdAt: (row.createdAt as string) ?? null,
          }),
        )
      : [];

    return {
      data: rows,
      total: result.pagination?.totalItems || 0,
      page: result.pagination?.currentPage || page,
      pageSize: result.pagination?.itemsPerPage || limit,
      totalPages: result.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error("Error fetching beckn-ext list:", error);
    if (error instanceof Error && error.message && !("status" in error)) {
      if (
        error.message.startsWith("HTTP") ||
        error.message.includes("Failed to fetch") ||
        error.name === "TypeError"
      ) {
        throw new Error(getBecknExtFriendlyError());
      }
    }
    throw error;
  }
};

// ── Use-case health: working vs not working from latest call / error ─────────
// The reporting window applies only to counts/rates. Current status always
// comes from the latest recorded call, even when that call predates the window.

export type BecknExtUseCaseHealthStatus =
  | "working"
  | "not_working"
  | "unknown";

export interface BecknExtUseCaseHealth {
  useCase: string;
  status: BecknExtUseCaseHealthStatus;
  totalCalls: number;
  totalSuccess: number;
  totalErrors: number;
  successRate: number;
  maxLatencyMs: number;
  /** Most recent call timestamp (startEts || createdAt) */
  latestCallAt: string | null;
  latestCallSuccess: boolean | null;
  latestStatusCode: number | null;
  latestMethod: string | null;
  latestUrl: string | null;
  latestLatencyMs: number | null;
  /** Most recent failed call timestamp in sampled window */
  latestErrorAt: string | null;
  latestErrorStatusCode: number | null;
  latestErrorUrl: string | null;
  /** Most recent successful call timestamp in sampled window */
  latestSuccessAt: string | null;
  /**
   * When the current outage started (only for not_working).
   * Prefer time of last success (outage since then); else oldest consecutive
   * failure in the recent sample.
   */
  downSinceAt: string | null;
  /** Milliseconds from downSinceAt until now (0 when working / unknown). */
  downForMs: number;
  /** Whole hours down (floor). Useful for “down for X hours”. */
  downForHours: number;
  /** Consecutive failed calls at the head of the sample (not_working only). */
  consecutiveFailures: number;
}

export interface BecknExtUseCaseHealthResponse {
  overall: BecknExtStats;
  useCases: BecknExtUseCaseHealth[];
  workingCount: number;
  notWorkingCount: number;
  unknownCount: number;
  /** Longest outage among not_working use cases (ms). */
  maxDownForMs: number;
}

function logTimestamp(log: BecknExtLog | undefined | null): string | null {
  if (!log) return null;
  return log.startEts || log.createdAt || log.endEts || null;
}

function isLogSuccess(log: BecknExtLog): boolean {
  if (log.extApiSuccess === true) return true;
  if (
    log.extApiSuccess == null &&
    log.extApiStatusCode != null &&
    log.extApiStatusCode >= 200 &&
    log.extApiStatusCode < 400
  ) {
    return true;
  }
  return false;
}

function isLogFailure(log: BecknExtLog): boolean {
  if (log.extApiSuccess === false) return true;
  if (
    log.extApiSuccess == null &&
    log.extApiStatusCode != null &&
    log.extApiStatusCode >= 400
  ) {
    return true;
  }
  return false;
}

/**
 * Resolve working / not working from the latest outbound API call for a use case.
 * - working: latest call extApiSuccess === true
 * - not_working: latest call extApiSuccess === false
 * - unknown: no samples or success flag missing
 */
function resolveUseCaseHealthStatus(
  latest: BecknExtLog | undefined,
): BecknExtUseCaseHealthStatus {
  if (!latest) return "unknown";
  if (isLogSuccess(latest)) return "working";
  if (isLogFailure(latest)) return "not_working";
  return "unknown";
}

/**
 * Outage start for a failing use case (logs newest → oldest):
 * 1. Prefer last success time → "down since last success"
 * 2. Else oldest failure in the current consecutive failure streak
 * 3. Else latest call time
 */
function resolveOutage(
  status: BecknExtUseCaseHealthStatus,
  logs: BecknExtLog[],
  latestSuccessAt: string | null,
  latestCallAt: string | null,
): {
  downSinceAt: string | null;
  downForMs: number;
  downForHours: number;
  consecutiveFailures: number;
} {
  if (status !== "not_working") {
    return {
      downSinceAt: null,
      downForMs: 0,
      downForHours: 0,
      consecutiveFailures: 0,
    };
  }

  let consecutiveFailures = 0;
  let oldestFailInStreak: string | null = null;
  for (const log of logs) {
    if (isLogFailure(log)) {
      consecutiveFailures += 1;
      oldestFailInStreak = logTimestamp(log) || oldestFailInStreak;
      continue;
    }
    // Hit a success or unknown → end of current failure streak
    break;
  }

  // Primary: hours since last known success (most useful for ops)
  // Fallback: start of consecutive failure streak in recent sample
  const downSinceAt =
    latestSuccessAt || oldestFailInStreak || latestCallAt || null;

  let downForMs = 0;
  if (downSinceAt) {
    const t = new Date(downSinceAt).getTime();
    if (Number.isFinite(t)) {
      downForMs = Math.max(0, Date.now() - t);
    }
  }

  return {
    downSinceAt,
    downForMs,
    downForHours: Math.floor(downForMs / (1000 * 60 * 60)),
    consecutiveFailures,
  };
}

/**
 * Per use-case health snapshot for the External API status page.
 * The use-case catalog and latest-call lookup are intentionally unbounded so
 * an API last accessed before the reporting window still has a current status.
 * Counts and success rates remain scoped to the requested reporting window.
 */
export const fetchBecknExtUseCaseHealth = async (
  params: BecknExtStatsParams = {},
): Promise<BecknExtUseCaseHealthResponse> => {
  const [overall, catalogStats] = await Promise.all([
    fetchBecknExtStats({
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    fetchBecknExtStats(),
  ]);

  const catalog = (catalogStats.useCases || []).filter((u) => u.useCase);
  if (catalog.length === 0) {
    return {
      overall,
      useCases: [],
      workingCount: 0,
      notWorkingCount: 0,
      unknownCount: 0,
      maxDownForMs: 0,
    };
  }

  const useCases: BecknExtUseCaseHealth[] = await Promise.all(
    catalog.map(async (entry): Promise<BecknExtUseCaseHealth> => {
      const [ucStats, list] = await Promise.all([
        fetchBecknExtStats({
          startDate: params.startDate,
          endDate: params.endDate,
          useCase: entry.useCase,
        }).catch(() => EMPTY_BECKN_EXT_STATS),
        // Do not apply the reporting window here. "Current" is the result of
        // the last time this API was actually accessed, however old that is.
        fetchBecknExtList({
          page: 1,
          limit: 100,
          useCase: entry.useCase,
          sortBy: "start_ets",
          sortOrder: "desc",
        }).catch(() => ({
          data: [] as BecknExtLog[],
          total: 0,
          page: 1,
          pageSize: 100,
          totalPages: 1,
        })),
      ]);

      const logs = list.data ?? [];
      const latest = logs[0];
      const latestError = logs.find((l) => isLogFailure(l));
      const latestSuccess = logs.find((l) => isLogSuccess(l));
      const latestCallAt = logTimestamp(latest);
      const latestSuccessAt = logTimestamp(latestSuccess);
      const status = resolveUseCaseHealthStatus(latest);
      const outage = resolveOutage(
        status,
        logs,
        latestSuccessAt,
        latestCallAt,
      );

      return {
        useCase: entry.useCase,
        status,
        totalCalls: ucStats.totalExternalApiCalls || 0,
        totalSuccess: ucStats.totalSuccess || 0,
        totalErrors: ucStats.totalErrors || 0,
        successRate: ucStats.successRate || 0,
        maxLatencyMs: ucStats.maxLatencyMs || 0,
        latestCallAt,
        latestCallSuccess: latest?.extApiSuccess ?? null,
        latestStatusCode: latest?.extApiStatusCode ?? null,
        latestMethod: latest?.extApiMethod ?? null,
        latestUrl: latest?.extApiUrl ?? null,
        latestLatencyMs: latest?.extApiLatencyMs ?? null,
        latestErrorAt: logTimestamp(latestError),
        latestErrorStatusCode: latestError?.extApiStatusCode ?? null,
        latestErrorUrl: latestError?.extApiUrl ?? null,
        latestSuccessAt,
        ...outage,
      };
    }),
  );

  // Sort: not working first (longest down first), then unknown, then working
  const statusRank: Record<BecknExtUseCaseHealthStatus, number> = {
    not_working: 0,
    unknown: 1,
    working: 2,
  };
  useCases.sort((a, b) => {
    const rank = statusRank[a.status] - statusRank[b.status];
    if (rank !== 0) return rank;
    if (a.status === "not_working") {
      return b.downForMs - a.downForMs;
    }
    const aErr = a.latestErrorAt ? new Date(a.latestErrorAt).getTime() : 0;
    const bErr = b.latestErrorAt ? new Date(b.latestErrorAt).getTime() : 0;
    return bErr - aErr;
  });

  const notWorking = useCases.filter((u) => u.status === "not_working");

  return {
    overall,
    useCases,
    workingCount: useCases.filter((u) => u.status === "working").length,
    notWorkingCount: notWorking.length,
    unknownCount: useCases.filter((u) => u.status === "unknown").length,
    maxDownForMs: notWorking.reduce((max, u) => Math.max(max, u.downForMs), 0),
  };
};

// Legacy aliases kept for any remaining imports / flow detail page
export type ProviderTelemetryLog = BecknExtLog;
export type ProviderTelemetrySummary = BecknExtStats;
export type ProviderTelemetryData = {
  summary: BecknExtStats;
  logs: PaginatedResponse<BecknExtLog>;
};
export type ProviderTelemetryPaginationParams = BecknExtListParams;

/** @deprecated Prefer fetchBecknExtStats + fetchBecknExtList */
export const fetchProviderTelemetry = async (
  params: BecknExtListParams = {},
): Promise<ProviderTelemetryData> => {
  const [summary, logs] = await Promise.all([
    fetchBecknExtStats({
      startDate: params.startDate,
      endDate: params.endDate,
      useCase: params.useCase,
    }).catch(() => EMPTY_BECKN_EXT_STATS),
    fetchBecknExtList(params).catch(() => ({
      data: [] as BecknExtLog[],
      total: 0,
      page: params.page || DEFAULT_PAGE,
      pageSize: params.limit || DEFAULT_LIMIT,
      totalPages: 1,
    })),
  ]);
  return { summary, logs };
};

// End-to-end flow for a single question_id: every provider_telemetry_events
// row that shares that question_id (one step in the flow), in order, with
// full request/response payloads — powers the flow detail page reached by
// clicking a row in the External API Observability log table.
export interface ProviderTelemetryFlowStep {
  id: string;
  stepSequence: number | null;
  eventName: string;
  serviceName: string;
  becknTransactionId: string | null;
  endpointUrl: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  success: boolean | null;
  errorMessage: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  eventTimestamp: string;
}

export interface ProviderTelemetryFlowSummary {
  totalSteps: number;
  overallSuccess: boolean;
  hasError: boolean;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  servicesInvolved: string[];
}

export interface ProviderTelemetryFlow {
  questionId: string;
  sessionId: string | null;
  summary: ProviderTelemetryFlowSummary | null;
  steps: ProviderTelemetryFlowStep[];
}

export const fetchProviderTelemetryFlow = async (
  questionId: string,
): Promise<ProviderTelemetryFlow> => {
  const response = await fetch(
    `${SERVER_URL}/provider-telemetry/flow/${encodeURIComponent(questionId)}`,
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch provider telemetry flow");
  }

  return result.data;
};
