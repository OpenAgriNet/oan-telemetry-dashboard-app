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
  Languages,
} from "lucide-react";
import { format } from "date-fns";
import { fetchFeedbackById, fetchTranslation } from "@/services/api";
import users from "@/data/users.json";
import sessions from "@/data/sessions.json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FeedbackDetails = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"markdown" | "raw">("markdown");

  const { data: feedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ["feedback", feedbackId],
    queryFn: () => fetchFeedbackById(feedbackId || ""),
    enabled: !!feedbackId,
  });

  const { data: translation } = useQuery({
    queryKey: ["translation", feedbackId],
    queryFn: () => fetchTranslation(feedbackId || ""),
    enabled: !!feedbackId,
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
  const user = feedback
    ? users.find((u) => u.id === feedback.userId) || {
        id: feedback.userId,
        name: feedback.userId,
      }
    : null;

  const session = feedback
    ? sessions.find((s) => s.sessionId === feedback.sessionId)
    : null;

  if (isFeedbackLoading) {
    return <div>Loading...</div>;
  }

  if (!feedback) {
    return <div>Feedback not found</div>;
  }

  const handleSessionClick = () => {
    if (session) {
      navigate(`/sessions/${session.sessionId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Feedback Details</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.name || "Unknown User"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(feedback.date), "MMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback.rating}/5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Questions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session?.numQuestions || 0}</div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question & Feedback</CardTitle>
          <CardDescription>Detailed feedback information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Feedback</h3>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-foreground">
                {feedback.feedback}
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
          </div>
          <div
            className={`p-4 rounded-lg border border-border bg-card ${
              session ? "cursor-pointer hover:bg-muted transition-colors" : ""
            }`}
            onClick={session ? handleSessionClick : undefined}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4" />
              <h3 className="font-medium">Session Question</h3>
            </div>
            <p className="text-foreground">{feedback.question}</p>
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
              <h3 className="font-medium mb-2">Response</h3>
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
                        {feedback.answer}
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
                      >{feedback.answer}</pre>
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

export default FeedbackDetails;
