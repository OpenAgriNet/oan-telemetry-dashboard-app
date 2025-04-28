
import users from '../data/users.json';
import sessions from '../data/sessions.json';
import questions from '../data/questions.json';
import dailyMetrics from '../data/dailyMetrics.json';

// Types
export interface User {
  id: string;
  name: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  numQuestions: number;
  startTime: string;
  endTime: string;
  device: string;
}

export interface Question {
  id: string;
  text: string;
  userId: string;
  sessionId: string;
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

// Fetch functions with simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchUsers = async (): Promise<User[]> => {
  await delay(300);
  return users;
};

export const fetchSessions = async (): Promise<Session[]> => {
  await delay(400);
  return sessions;
};

export const fetchQuestions = async (): Promise<Question[]> => {
  await delay(500);
  return questions;
};

export const fetchDailyMetrics = async (): Promise<DailyMetric[]> => {
  await delay(350);
  return dailyMetrics;
};

// Generate reports based on the raw data
export const generateUserReport = async (
  userId?: string, 
  startDate?: string, 
  endDate?: string
): Promise<UserReport[]> => {
  const [usersData, sessionsData, questionsData] = await Promise.all([
    fetchUsers(),
    fetchSessions(),
    fetchQuestions()
  ]);
  
  // Filter by user if specified
  let filteredUsers = usersData;
  if (userId) {
    filteredUsers = usersData.filter(user => user.id === userId);
  }
  
  // Generate report for each user
  const report = filteredUsers.map(user => {
    // Get sessions for this user
    const userSessions = sessionsData.filter(session => session.userId === user.id);
    
    // Apply date filter if specified
    const filteredSessions = userSessions.filter(session => {
      if (!startDate && !endDate) return true;
      
      const sessionDate = new Date(session.startTime);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
      
      return sessionDate >= start && sessionDate <= end;
    });
    
    // Get questions for this user
    const userQuestions = questionsData.filter(question => question.userId === user.id);
    
    // Determine first and last session dates
    const sessionDates = filteredSessions.map(s => new Date(s.startTime).getTime());
    const firstSession = sessionDates.length ? new Date(Math.min(...sessionDates)).toISOString() : '';
    const lastSession = sessionDates.length ? new Date(Math.max(...sessionDates)).toISOString() : '';
    
    return {
      id: user.id,
      name: user.name,
      numSessions: filteredSessions.length,
      numQuestions: userQuestions.length,
      firstSessionDate: firstSession,
      lastSessionDate: lastSession
    };
  });
  
  // Filter out users with no sessions in the date range
  return report.filter(user => user.numSessions > 0);
};

export const generateSessionReport = async (
  userId?: string,
  startDate?: string,
  endDate?: string
): Promise<Session[]> => {
  let sessionsData = await fetchSessions();
  
  // Filter by user if specified
  if (userId) {
    sessionsData = sessionsData.filter(session => session.userId === userId);
  }
  
  // Apply date filter if specified
  if (startDate || endDate) {
    sessionsData = sessionsData.filter(session => {
      const sessionDate = new Date(session.startTime);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
      
      return sessionDate >= start && sessionDate <= end;
    });
  }
  
  return sessionsData;
};

export const generateQuestionsReport = async (
  userId?: string,
  sessionId?: string,
  startDate?: string,
  endDate?: string,
  searchText?: string
): Promise<Question[]> => {
  let questionsData = await fetchQuestions();
  
  // Filter by user if specified
  if (userId) {
    questionsData = questionsData.filter(question => question.userId === userId);
  }
  
  // Filter by session if specified
  if (sessionId) {
    questionsData = questionsData.filter(question => question.sessionId === sessionId);
  }
  
  // Apply date filter if specified
  if (startDate || endDate) {
    questionsData = questionsData.filter(question => {
      const questionDate = new Date(question.dateAsked);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000); // Max date
      
      return questionDate >= start && questionDate <= end;
    });
  }
  
  // Filter by search text if specified
  if (searchText) {
    const searchLower = searchText.toLowerCase();
    questionsData = questionsData.filter(question => 
      question.text.toLowerCase().includes(searchLower)
    );
  }
  
  return questionsData;
};
