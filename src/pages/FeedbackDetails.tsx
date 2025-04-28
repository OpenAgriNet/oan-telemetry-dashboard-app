import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MessageCircle, Calendar, ThumbsUp, Languages } from "lucide-react";
import { format } from "date-fns";
import { fetchFeedbackById, fetchTranslation } from "@/services/api";
import users from "@/data/users.json";
import sessions from "@/data/sessions.json";

const FeedbackDetails = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();

  const { data: feedback, isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['feedback', feedbackId],
    queryFn: () => fetchFeedbackById(feedbackId || ''),
    enabled: !!feedbackId
  });

  const { data: translation } = useQuery({
    queryKey: ['translation', feedbackId],
    queryFn: () => fetchTranslation(feedbackId || ''),
    enabled: !!feedbackId
  });

  const user = feedback ? users.find(u => u.id === feedback.userId) : null;
  const session = feedback ? sessions.find(s => s.sessionId === feedback.sessionId) : null;

  if (isFeedbackLoading) {
    return <div>Loading...</div>;
  }

  if (!feedback || !user) {
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
        <h1 className="text-2xl font-bold tracking-tight">
          Feedback Details
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.name}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(feedback.timestamp), "MMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>

        <Card>
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
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question & Feedback</CardTitle>
          <CardDescription>Detailed feedback information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="cursor-pointer p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            onClick={handleSessionClick}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4" />
              <h3 className="font-medium">Session Question</h3>
            </div>
            <p className="text-muted-foreground">{feedback.questionText}</p>
            {translation?.questionMarathi && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Marathi</span>
                </div>
                <p className="text-muted-foreground mt-1">{translation.questionMarathi}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">AI Response</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">English</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{feedback.aiResponse}</p>
                </div>
                {translation?.responseMarathi && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Marathi</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{translation.responseMarathi}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Feedback</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">English</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{feedback.feedback}</p>
                </div>
                {translation?.feedbackMarathi && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Marathi</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{translation.feedbackMarathi}</p>
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
