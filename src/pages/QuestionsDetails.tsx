import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  MessageCircle,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Languages,
  RefreshCw,
  AlertCircle,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { fetchFeedbackById, fetchQuestionById, fetchTranslation } from "@/services/api";
import users from "@/data/users.json";
import sessions from "@/data/sessions.json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuestionDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const { 
    data: question, 
    isLoading: isQuestionLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ["question", id],
    queryFn: () => fetchQuestionById(id || ""),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: translation } = useQuery({
    queryKey: ["translation", id],
    queryFn: () => fetchTranslation(id || ""),
    enabled: !!id,
  });

  const markdownComponents: Components = {
    // Text elements
    p: ({ children }) => (
      <p className="mb-4 text-foreground leading-relaxed">{children}</p>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-foreground mt-6 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold text-foreground mt-5 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold text-foreground mt-4 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-foreground mt-3 mb-2">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 text-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-1">{children}</li>,

    // Links and references
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),

    // Code elements
    pre: ({ children }) => (
      <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-4 text-foreground">
        {children}
      </pre>
    ),
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;
      return isInline ? (
        <code
          className="bg-muted rounded px-1.5 py-0.5 text-foreground font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      ) : (
        <code
          className={`${className} text-foreground font-mono text-sm`}
          {...props}
        >
          {children}
        </code>
      );
    },

    // Other elements
    hr: () => <hr className="border-border my-6" />,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-medium text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-foreground">{children}</td>
    ),
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="max-w-full h-auto rounded-md my-4" />
    ),
  };

  // Try to find user in local data, but use API userId as fallback
  const user = question
    ? users.find((u) => u.id === question.userId) || {
        id: question.userId,
        name: question.userId,
      }     
    : null;

  const session = question
    ? sessions.find((s) => s.sessionId === question.session_id)
    : null;

  const handleSessionClick = () => {
    if (session) {
      navigate(`/sessions/${question?.session_id}`);
    }
  };

  // Show loading state
  if (isQuestionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Feedback Details</h1>
        </div>
        <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Loading feedback details...</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Question Details</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading question details</p>
            <p className="text-destructive/80 text-sm mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!question) {      
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Feedback Details</h1>
        </div>
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">Question not found</p>
          <p className="text-sm text-muted-foreground/80 mb-4">
            The question you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/questions')} variant="outline">
            Back to Questions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Question Details</h1>
        <Button onClick={() => navigate('/questions')} variant="outline">
          Back to Questions
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
                {question?.user_id || "Unknown User"}    
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Question Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {question?.dateAsked || question?.created_at || "N/A"}   
            </div>
          </CardContent>
        </Card>
        
        {question?.reaction !== "neutral" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              {question?.reaction === "like" ? (
                <ThumbsUp className="h-4 w-4 text-green-600" />
              ) : (
                <ThumbsDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {question?.reaction === "like" ? (
                  <>
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-bold text-green-600">Like</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-bold text-red-600">Dislike</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <button onClick={() => navigate(`/sessions/${question?.session_id}`)}>

              <code className="truncate text-left text-primary hover:underline bg-transparent border-none p-0 m-0 w-full">
                {question?.session_id ? question.session_id.substring(0, 6) + '...' : 'N/A'}
              </code>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question & Response</CardTitle>
          <CardDescription>Detailed question and response information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <div>
            <h3 className="font-medium mb-2">User Feedback</h3>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-foreground">
                {question?.feedback || "No feedback provided"}
              </p>
              {translation?.feedbackMarathi && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="h-4 w-4" />
                    <span className="text-sm font-medium">Marathi Translation</span>
                  </div>
                  <p className="text-muted-foreground">
                    {translation.feedbackMarathi}
                  </p>
                </div>
              )}
            </div>
          </div> */}
          <div
            className={`p-4 rounded-lg border border-border bg-card ${
              session ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""
            }`}
            onClick={session ? handleSessionClick : undefined}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4" />
              <h3 className="font-medium">Original Question</h3>
              {session && (
                <span className="text-xs text-muted-foreground">(Click to view session)</span>
              )}
            </div>
            <p className="text-foreground">{question?.question}</p>
            {translation?.questionMarathi && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm font-medium">Marathi Translation</span>
                </div>
                <p className="text-muted-foreground">
                  {translation.questionMarathi}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">AI Response</h3>
              <div className="p-4 rounded-lg border border-border bg-card">
                <Tabs defaultValue="markdown" className="mt-0">
                  <TabsList>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    <TabsTrigger value="raw">Raw Text</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="markdown"
                    className="mt-4 prose-sm max-w-none text-foreground"
                  >
                    <div className="prose-code:bg-muted prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                      >
                        {question?.answer}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                  <TabsContent value="raw" className="mt-4">
                    <div className="bg-muted/50 p-3 rounded-md overflow-x-auto">
                      <pre 
                        style={{ 
                          whiteSpace: 'pre', 
                          wordWrap: 'normal',
                          overflowX: 'auto',
                          fontFamily: 'monospace'
                        }}
                        className="text-foreground text-sm"
                      >{question?.answer}</pre>
                    </div>
                  </TabsContent>
                </Tabs>
                {translation?.responseMarathi && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="h-4 w-4" />
                      <span className="text-sm font-medium">Marathi Translation</span>
                    </div>
                    <p className="text-muted-foreground">
                      {translation.responseMarathi}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionDetails;
