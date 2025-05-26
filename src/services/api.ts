import React from 'react';
import { API_CONFIG } from '../config/environment';

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
  dailyActivity: Array<{
    date: string;
    activeUsers: number;
    questionsCount: number;
  }>;
}

// Users API - Updated to match actual backend controller
export const fetchUsers = async (params: UserPaginationParams = {}): Promise<PaginatedResponse<User>> => {
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

    console.log('Fetching users with URL:', `${SERVER_URL}/users?${queryParams}`);

    const response = await fetch(`${SERVER_URL}/users?${queryParams}`);
    
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

    const response = await fetch(`${SERVER_URL}/users/${username}?${queryParams}`);
    
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
    return result.data;
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
export const fetchSessionStats = async (params: PaginationParams = {}): Promise<{
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

// Legacy support functions (these will be deprecated)
export const fetchDailyMetrics = async (): Promise<DailyMetric[]> => {
  // This would be replaced with a proper API call
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(350);
  return []; // Return empty array until proper endpoint is implemented
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
