import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  MessageSquare,
  Calendar,
  Activity,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Bot,
  Heart
} from "lucide-react";
import { 
  fetchSessionById, 
  fetchQuestionsBySessionId,
  fetchFeedbackBySessionId,
  fetchErrorsBySessionId,
  type SessionDetail,
  type Question,
  type Feedback,
  type ErrorDetail
} from "@/services/api";
import { formatUTCToIST } from "@/lib/utils";

// Helper function to get a safe ISO string from question data
function getQuestionTimestampISO(question: Question): string {
  // 1. question.ets (often epoch milliseconds)
  if (question.ets) {
    const etsValue = question.ets;
    // Try parsing as number first (if it's string or number)
    const etsNumber = Number(etsValue);
    if (!isNaN(etsNumber) && etsNumber !== 0) { // Added etsNumber !== 0 to avoid epoch 0 if it's truly 0
      const d = new Date(etsNumber);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // If etsValue was a string and not numeric, or if Number(etsValue) was NaN/0, try parsing etsValue as a date string
    if (typeof etsValue === 'string') {
        const d = new Date(etsValue);
        if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  // 2. question.dateAsked (likely a date string)
  if (question.dateAsked) {
    const d = new Date(question.dateAsked);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // 3. question.created_at (likely a date string)
  if (question.created_at) {
    const d = new Date(question.created_at);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // Fallback
  console.warn(`Invalid or missing timestamp for question ID ${question.id}. Defaulting to current time.`);
  return new Date().toISOString();
}

// Helper function to get a safe ISO string from feedback data
function getFeedbackTimestampISO(feedback: Feedback): string {
  // Prefer feedback.timestamp if present
  if (feedback.timestamp) {
    const tsNum = Number(feedback.timestamp);
    if (!isNaN(tsNum) && tsNum > 1000000000000) {
      const d = new Date(tsNum);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    // Try as ISO string
    const d = new Date(feedback.timestamp);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // fallback to date
  if (feedback.date) {
    const dateNum = Number(feedback.date);
    if (!isNaN(dateNum) && dateNum > 1000000000000) {
      const d = new Date(dateNum);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    const d = new Date(feedback.date);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

// Helper function to get a safe ISO string from error data
function getErrorTimestampISO(error: ErrorDetail): string {
  // 1. Try error.fullDate first (UTC ISO string from backend)
  if (error.fullDate) {
    const d = new Date(error.fullDate);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  
  // 2. Try error.lastOccurrence (UTC ISO string from backend)
  if (error.lastOccurrence) {
    const d = new Date(error.lastOccurrence);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  
  // 3. Try any timestamp-like properties that might be UTC
  const timestampProps = ['ets', 'created_at', 'timestamp'];
  for (const prop of timestampProps) {
    if (error[prop]) {
      const value = error[prop];
      // Try as number (epoch milliseconds)
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > 1000000000000) {
        const d = new Date(numValue);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      // Try as ISO string
      const d = new Date(value as string);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  
  // 4. Last resort: try error.date + error.time (IST formatted by backend)
  if (error.date && error.time) {
    try {
      // Create a combined date string - this is a best effort fallback
      // The backend formats these in IST, so we'll just use them as-is for chronological order
      const combinedDateTime = `${error.date} ${error.time}`;
      const d = new Date(combinedDateTime);
      if (!isNaN(d.getTime())) {
        // Return as-is - while not perfectly UTC, it will maintain chronological order
        return d.toISOString();
      }
    } catch (err) {
      console.warn(`Error parsing date/time combination: ${error.date} ${error.time}`, err);
    }
  }
  
  console.warn(`Invalid or missing timestamp for error ID ${error.id}. Defaulting to current time.`);
  return new Date().toISOString();
}

const SessionDetails = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Fetch session details
  const { 
    data: sessionDetail, 
    isLoading: isLoadingSession,
    error: sessionError,
    refetch: refetchSession
  } = useQuery({
    queryKey: ["sessionDetails", sessionId],
    queryFn: () => fetchSessionById(sessionId || ""),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch questions for this session
  const { 
    data: sessionQuestions = [], 
    isLoading: isLoadingQuestions,
    error: questionsError,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: ["sessionQuestions", sessionId],
    queryFn: () => fetchQuestionsBySessionId(sessionId || ""),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch feedback for this session
  const { 
    data: sessionFeedback = [], 
    isLoading: isLoadingFeedback,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery({
    queryKey: ["sessionFeedback", sessionId],
    queryFn: () => fetchFeedbackBySessionId(sessionId || ""),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch errors for this session
  const { 
    data: sessionErrors = [], 
    isLoading: isLoadingErrors,
    error: errorsError,
    refetch: refetchErrors
  } = useQuery({
    queryKey: ["sessionErrors", sessionId],
    queryFn: () => fetchErrorsBySessionId(sessionId || ""),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isLoading = isLoadingSession || isLoadingQuestions || isLoadingFeedback || isLoadingErrors;
  const error = sessionError || questionsError || feedbackError || errorsError;

  // Create chronological conversation flow
  const conversationFlow = React.useMemo(() => {
    interface ConversationEvent {
      id: string;
      type: 'question' | 'answer' | 'feedback' | 'error';
      timestamp: string;
      content: string;
      metadata?: {
        channel?: string;
        hasVoiceInput?: boolean;
        reaction?: string;
        questionId?: string | number;
        feedbackType?: string;
        user?: string;
        relatedQuestionId?: string | number;
        errorType?: string;
        environment?: string;
      };
    }

    const events: ConversationEvent[] = [];

    // Add questions and answers
    sessionQuestions.forEach((question: Question) => {
      // Add user question
      events.push({
        id: `q-${question.id}`,
        type: 'question',
        timestamp: getQuestionTimestampISO(question),
        content: question.question,
        metadata: { 
          channel: question.channel,
          hasVoiceInput: question.hasVoiceInput,
          user: question.user_id,
          questionId: question.id
        }
      });

      // Add AI answer if available
      if (question.answer) {
        events.push({
          id: `a-${question.id}`,
          type: 'answer',
          timestamp: getQuestionTimestampISO(question), // Answer uses the same timestamp as its question
          content: question.answer,
          metadata: { 
            reaction: question.reaction,
            questionId: question.id,
            channel: question.channel
          }
        });
      }
    });

    // Add feedback events
    sessionFeedback.forEach((feedback: Feedback) => {
      events.push({
        id: `f-${feedback.id}`,
        type: 'feedback',
        timestamp: getFeedbackTimestampISO(feedback),
        content: feedback.feedback || `User ${feedback.rating} this response`,
        metadata: { 
          feedbackType: feedback.rating,
          user: feedback.user,
          relatedQuestionId: feedback.question ? 'related' : undefined
        }
      });
    });

    // Add error events
    sessionErrors.forEach((error: ErrorDetail) => {
      events.push({
        id: `e-${error.id}`,
        type: 'error',
        timestamp: getErrorTimestampISO(error),
        content: error.errorMessage || 'System error occurred',
        metadata: { 
          errorType: error.errorType,
          environment: error.environment,
          user: error.userId,
          questionId: error.questionId
        }
      });
    });

    // Add errors from session details if available
    // if (sessionDetail?.errors) {
    //   sessionDetail.errors.forEach((error) => {
    //     events.push({
    //       id: `e-${error.id}`,
    //       type: 'error',
    //       timestamp: error.timestamp,
    //       content: 'System error occurred',
    //       metadata: { 
    //         channel: error.channel 
    //       }
    //     });
    //   });
    // } // TODO errors are not being returned from the API

    // Sort by timestamp
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [sessionDetail, sessionQuestions, sessionFeedback, sessionErrors]);

  const formatTimestamp = (timestamp: string) => {
    try {
      // Use the utility function to format UTC timestamp to IST
      return formatUTCToIST(timestamp, "HH:mm:ss zzz");
    } catch (error) {
      console.warn("Error formatting timestamp to IST:", error, "Input:", timestamp);
      return "00:00:00 (IST)"; // Fallback with timezone indication
    }
  };

  const renderMessage = (event: {
    id: string;
    type: 'question' | 'answer' | 'feedback' | 'error';
    timestamp: string;
    content: string;
    metadata?: {
      channel?: string;
      hasVoiceInput?: boolean;
      reaction?: string;
      questionId?: string | number;
      feedbackType?: string;
      user?: string;
      relatedQuestionId?: string | number;
      errorType?: string;
      environment?: string;
    };
  }, index: number) => {
    const isUser = event.type === 'question';
    const isSystem = event.type === 'error';
    const isFeedback = event.type === 'feedback';
    const isAnswer = event.type === 'answer';

    return (
      <div
        key={event.id}
        className={`flex gap-3 ${isUser || isFeedback ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isUser && !isFeedback && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {isSystem ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </div>
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser || isFeedback ? 'order-1' : ''}`}>
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser 
                ? 'bg-primary text-primary-foreground ml-auto' 
                : isSystem 
                ? 'bg-destructive/10 border border-destructive/20'
                : isFeedback
                ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                : 'bg-muted'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap break-words">
              {event.content}
            </div>
            
            {/* {isSystem && event.metadata && (
              <div className="mt-2 space-y-1">
                {event.metadata.errorType && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium text-destructive">Type:</span>
                    <span className="opacity-70">{event.metadata.errorType}</span>
                  </div>
                )}
                {event.metadata.environment && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium text-destructive">Environment:</span>
                    <span className="opacity-70">{event.metadata.environment}</span>
                  </div>
                )}
              </div>
            )}
             */}
            {isFeedback && event.metadata?.feedbackType && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {event.metadata.feedbackType === 'like' ? (
                  <ThumbsUp className="w-3 h-3 text-green-500" />
                ) : event.metadata.feedbackType === 'dislike' ? (
                  <ThumbsDown className="w-3 h-3 text-red-500" />
                ) : (
                  <Heart className="w-3 h-3 text-purple-500" />
                )}
                <span className="opacity-70 capitalize">{event.metadata.feedbackType} feedback</span>
              </div>
            )}
            
            {event.metadata?.reaction && !isFeedback && !isSystem && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {event.metadata.reaction === 'like' ? (
                  <ThumbsUp className="w-3 h-3 text-green-500" />
                ) : event.metadata.reaction === 'dislike' ? (
                  <ThumbsDown className="w-3 h-3 text-red-500" />
                ) : null}
                <span className="opacity-70">{event.metadata.reaction}</span>
              </div>
            )}
            
            {event.metadata?.hasVoiceInput && (
              <div className="mt-1 text-xs opacity-70">
                🎤 Voice input
              </div>
            )}
          </div>
          
          <div className={`text-xs text-muted-foreground mt-1 ${isUser || isFeedback ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(event.timestamp)}
            {event.metadata?.channel && (
              <span className="ml-2 px-1 py-0.5 bg-muted rounded text-xs">
                {event.metadata.channel}
              </span>
            )}
            {event.metadata?.user && (
              <span className="ml-2 px-1 py-0.5 bg-muted rounded text-xs">
                {event.metadata.user}
              </span>
            )}
          </div>
        </div>

        {(isUser || isFeedback) && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              {isFeedback ? (
                <Heart className="w-4 h-4 text-secondary-foreground" />
              ) : (
                <User className="w-4 h-4 text-secondary-foreground" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Session Details</h1>
          <Button onClick={() => navigate('/sessions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
        <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Loading session details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Session Details</h1>
          <Button onClick={() => navigate('/sessions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading session data</p>
            <p className="text-destructive/80 text-sm mb-4">
              {sessionError?.message || questionsError?.message || feedbackError?.message || errorsError?.message}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => refetchSession()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Session
              </Button>
              <Button onClick={() => refetchQuestions()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Questions
              </Button>
              <Button onClick={() => refetchFeedback()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Feedback
              </Button>
              {/* <Button onClick={() => refetchErrors()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Errors
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!sessionDetail && !sessionQuestions.length && !sessionFeedback.length && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Session Details</h1>
          <Button onClick={() => navigate('/sessions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">Session not found</p>
          <p className="text-sm text-muted-foreground/80 mb-4">
            The session you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/sessions')} variant="outline">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const sessionUsername = sessionDetail?.username || sessionQuestions[0]?.user_id || "Unknown User";
  const totalQuestions = sessionQuestions.length;
  const totalFeedback = sessionFeedback.length;
  const totalErrors = sessionErrors.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Session Details
        </h1>
        <Button onClick={() => navigate('/sessions')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          <div className="text-lg font-bold">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              {sessionUsername}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Questions</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuestions}</div>
          <p className="text-xs text-muted-foreground">
            {totalQuestions === 1 ? "question" : "questions"} asked
          </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback</CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          <div className="text-2xl font-bold">{totalFeedback}</div>
          <p className="text-xs text-muted-foreground">
            feedback responses
          </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Session ID</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          <div className="text-sm">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs break-all">
              {sessionId}
            </code>
          </div>
          </CardContent>
        </Card>
{/* 
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          <div className="text-2xl font-bold">{totalErrors}</div>
          <p className="text-xs text-muted-foreground">
            system errors
          </p>
          </CardContent>
        </Card> */}
      </div>

      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Session ID</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        <div className="text-sm">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs break-all">
            {sessionId}
          </code>
        </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
          <CardDescription>
            Chronological chat recreation from session data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversationFlow.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium mb-2">No conversation data</p>
              <p className="text-sm text-muted-foreground/80">
                This session doesn't contain any questions or messages.
                      </p>
                    </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
              {conversationFlow.map((event, index) => renderMessage(event, index))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalFeedback > 0 && sessionFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Feedback</CardTitle>
            <CardDescription>Feedback provided during this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionFeedback.map((feedback) => (
                <div 
                  key={feedback.id} 
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {feedback.rating === 'like' ? (
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {feedback.rating}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimestamp(getFeedbackTimestampISO(feedback))}
                    </span>
                  </div>
                  <p className="text-sm">{feedback.feedback}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* {totalErrors > 0 && sessionErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Errors</CardTitle>
            <CardDescription>Errors that occurred during this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionErrors.map((error) => (
                <div 
                  key={error.id} 
                  className="p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">
                      {error.errorType || 'System Error'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimestamp(getErrorTimestampISO(error))}
                    </span>
                  </div>
                  <p className="text-sm text-destructive/80 mb-2">{error.errorMessage}</p>
                  {(error.environment || error.userId || error.questionId) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {error.environment && (
                        <div>Environment: <span className="font-mono">{error.environment}</span></div>
                      )}
                      {error.userId && (
                        <div>User: <span className="font-mono">{error.userId}</span></div>
                      )}
                      {error.questionId && (
                        <div>Question ID: <span className="font-mono">{error.questionId}</span></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
};

export default SessionDetails;
