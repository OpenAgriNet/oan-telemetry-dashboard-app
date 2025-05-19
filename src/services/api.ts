import users from '../data/users.json';
import sessions from '../data/sessions.json';
import questions from '../data/questions.json';
import dailyMetrics from '../data/dailyMetrics.json';
import feedback from '../data/feedback.json';
import translations from '../data/translations.json';

// Types
export interface User {
  id: string;
  username: string;
  sessions: number;
  latestSession: string;
}

export interface Session {
  sessionId: string;
  username: string;
  questionCount: number;
  sessionTime: string;
}

export interface Question {
  id: number;
  qid: string;
  question: string;
  answer: string | null;
  question_type: string;
  user_id: string;
  created_at: string;
  event_ets: string;
  channel: string;
  session_id: string;
  dateAsked: string;
  hasVoiceInput: boolean;
  reaction: string;
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
  id: string;
  sessionId: string;
  userId: string;
  questionText: string;
  feedback: string;
  aiResponse?: string;
  rating: number;
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
  icon?: any;
  sampleData: string | string[] | object;
  clip?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
  username?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

// Fetch functions with simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchUsers = async (pagination?: PaginationParams): Promise<PaginatedResponse<User>> => {
  try {
    const response = await fetch('http://localhost:3001/api/v1/users');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch users');
    }

    return {
      data: result.data,
      total: result.data.length,
      page: 1,
      pageSize: result.data.length,
      totalPages: 1
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchSessions = async (pagination?: PaginationParams): Promise<PaginatedResponse<Session>> => {
  try {
    const response = await fetch('http://localhost:3001/api/v1/sessions');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch sessions');
    }

    const { page = 1, pageSize = 10 } = pagination || {};
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = result.data.slice(start, end);

    return {
      data: paginatedData,
      total: result.data.length,
      page,
      pageSize,
      totalPages: Math.ceil(result.data.length / pageSize)
    };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

export const fetchQuestions = async (pagination?: PaginationParams): Promise<PaginatedResponse<Question>> => {
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination || {};
  
  try {
    const response = await fetch(`http://localhost:3001/api/v1/questions?page=${page}&pageSize=${pageSize}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to fetch questions');
    }

    return {
      data: result.data,
      total: result.data.length, // You might want to get total count from the API
      page,
      pageSize,
      totalPages: Math.ceil(result.data.length / pageSize)
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const fetchDailyMetrics = async (): Promise<DailyMetric[]> => {
  await delay(350);
  return dailyMetrics;
};

export const fetchFeedback = async (pagination?: PaginationParams): Promise<PaginatedResponse<Feedback>> => {
  await delay(300);
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = pagination || {};
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = feedback.slice(start, end);
  
  return {
    data,
    total: feedback.length,
    page,
    pageSize,
    totalPages: Math.ceil(feedback.length / pageSize)
  };
};

export const fetchFeedbackById = async (id: string): Promise<Feedback | undefined> => {
  await delay(200);
  return feedback.find(f => f.id === id);
};

export const fetchTranslation = async (feedbackId: string): Promise<Translation | undefined> => {
  await delay(200);
  return translations[feedbackId as keyof typeof translations];
};

export const generateUserReport = async (
  userId?: string, 
  startDate?: string, 
  endDate?: string
): Promise<UserReport[]> => {
  const [usersData, sessionsData, questionsData] = await Promise.all([
    fetchUsers({ page: 1, pageSize: 1000 }),
    fetchSessions({ page: 1, pageSize: 1000 }),
    fetchQuestions({ page: 1, pageSize: 1000 })
  ]);
  
  let filteredUsers = usersData.data;
  if (userId) {
    filteredUsers = usersData.data.filter(user => user.id === userId);
  }
  
  const report = filteredUsers.map(user => {
    const userSessions = sessionsData.data.filter(session => session.username === user.username);
    const filteredSessions = userSessions.filter(session => {
      if (!startDate && !endDate) return true;
      
      const sessionDate = new Date(session.sessionId);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      
      return sessionDate >= start && sessionDate <= end;
    });
    
    const userQuestions = questionsData.data.filter(question => question.user_id === user.username);
    
    const sessionDates = filteredSessions.map(s => new Date(s.sessionId).getTime());
    const firstSession = sessionDates.length ? new Date(Math.min(...sessionDates)).toISOString() : '';
    const lastSession = sessionDates.length ? new Date(Math.max(...sessionDates)).toISOString() : '';
    
    return {
      id: user.id,
      name: user.username,
      numSessions: filteredSessions.length,
      numQuestions: userQuestions.length,
      firstSessionDate: firstSession,
      lastSessionDate: lastSession
    };
  });
  
  return report.filter(user => user.numSessions > 0);
};

export const generateSessionReport = async (
  userId?: string,
  startDate?: string,
  endDate?: string
): Promise<Session[]> => {
  const sessionsData = await fetchSessions({ page: 1, pageSize: 1000 });
  let filteredSessions = sessionsData.data;
  
  if (userId) {
    filteredSessions = filteredSessions.filter(session => session.username === userId);
  }
  
  if (startDate || endDate) {
    filteredSessions = filteredSessions.filter(session => {
      const sessionDate = new Date(session.sessionId);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      
      return sessionDate >= start && sessionDate <= end;
    });
  }
  
  return filteredSessions;
};

export const generateQuestionsReport = async (
  pagination: PaginationParams,
  username?: string,
  sessionId?: string,
  startDate?: string,
  endDate?: string,
  searchText?: string
): Promise<PaginatedResponse<Question>> => {
  const allQuestions = await fetchQuestions({ page: 1, pageSize: 1000 });
  let filteredQuestions = allQuestions.data;
  
  if (username) {
    filteredQuestions = filteredQuestions.filter(question => question.user_id === username);
  }
  
  if (sessionId) {
    filteredQuestions = filteredQuestions.filter(question => question.session_id === sessionId);
  }
  
  if (startDate || endDate) {
    filteredQuestions = filteredQuestions.filter(question => {
      const questionDate = new Date(question.dateAsked);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      
      return questionDate >= start && questionDate <= end;
    });
  }
  
  if (searchText) {
    const searchLower = searchText.toLowerCase();
    filteredQuestions = filteredQuestions.filter(question => 
      question.question.toLowerCase().includes(searchLower)
    );
  }
  
  const { page, pageSize } = pagination;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredQuestions.slice(start, end);
  
  return {
    data: paginatedData,
    total: filteredQuestions.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredQuestions.length / pageSize)
  };
};

export const fetchSessionEvents = async (sessionId: string): Promise<SessionEvent[]> => {
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
