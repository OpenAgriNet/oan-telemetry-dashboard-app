
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, MessageCircle, Calendar, ThumbsUp, Languages } from "lucide-react";
import { format } from "date-fns";
import users from "@/data/users.json";
import sessions from "@/data/sessions.json";

// Mock feedback data - would come from an API in a real app
const feedbackData = [
  {
    id: "fb1",
    sessionId: "ses001",
    userId: "user1",
    questionText: "How do I improve my presentation skills?",
    feedback: "Very helpful response. The AI provided clear, actionable steps that I could immediately implement.",
    rating: 5,
    timestamp: "2025-04-28T09:01:45Z",
  },
  // ... other feedback items
];

// Mock translations - in a real app this would come from a translation service
const translations = {
  "fb1": {
    questionMarathi: "माझी प्रेझेंटेशन कौशल्ये कशी सुधारावीत?",
    feedbackMarathi: "खूप उपयुक्त प्रतिसाद. एआयने स्पष्ट, कृतीयोग्य पावले प्रदान केली जी मी लगेच अंमलात आणू शकतो.",
  },
  // Add more translations as needed
};

const FeedbackDetails = () => {
  const { feedbackId } = useParams();
  const navigate = useNavigate();
  const feedback = feedbackData.find(f => f.id === feedbackId);
  const user = feedback ? users.find(u => u.id === feedback.userId) : null;
  const session = feedback ? sessions.find(s => s.sessionId === feedback.sessionId) : null;
  const translation = feedbackId ? translations[feedbackId] : null;

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
