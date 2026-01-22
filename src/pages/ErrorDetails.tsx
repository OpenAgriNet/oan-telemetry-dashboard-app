import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Bug, 
  User, 
  Calendar, 
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { isSuperAdmin } from "@/utils/roleUtils";
import { fetchErrorById } from "@/services/api";

const ErrorDetails = () => {
  const { errorId } = useParams<{ errorId: string }>();
  const { keycloak } = useKeycloak();

  const { 
    data: errorDetail, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['error-detail', errorId],
    queryFn: () => fetchErrorById(errorId!),
    enabled: !!errorId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Check if user has super-admin role (after all hooks)
  if (!isSuperAdmin(keycloak)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/errors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Access Denied</p>
            <p className="text-destructive/80 text-sm">You don't have permission to access this page. Only super-admin users can view error details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/errors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
        </div>
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !errorDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/errors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error not found</p>
            <p className="text-destructive/80 text-sm">The error you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/errors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Error Details</h1>
            <p className="text-muted-foreground">
              Error ID: {errorDetail.id}
            </p>
          </div>
        </div>
      </div>

      {/* Main Error Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Error Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Error Message</label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="text-sm font-mono">{errorDetail.errorMessage}</p>
              </div>
            </div>

            {errorDetail.channel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Channel</label>
                <div className="mt-1">
                  <Badge variant="outline">{String(errorDetail.channel)}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <div className="mt-1">
                <span className="text-sm">{errorDetail.date}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Time</label>
              <div className="mt-1">
                <span className="text-sm">{errorDetail.time}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Timestamp</label>
              <div className="mt-1">
                <span className="text-sm font-mono">{errorDetail.fullDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Context Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {errorDetail.userId ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="mt-1">
                  <Link to={`/users?search=${errorDetail.userId}`} className="text-primary hover:underline">
                    {errorDetail.userId}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="mt-1 text-muted-foreground">Not available</div>
              </div>
            )}

            {errorDetail.sessionId ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                <div className="mt-1">
                  <Link to={`/sessions/${errorDetail.sessionId}`} className="text-primary hover:underline">
                    {errorDetail.sessionId}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session ID</label>
                <div className="mt-1 text-muted-foreground">Not available</div>
              </div>
            )}

            {errorDetail.questionId ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Question ID</label>
                <div className="mt-1">
                  <Link to={`/questions/${errorDetail.questionId}`} className="text-primary hover:underline">
                    {errorDetail.questionId}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Question ID</label>
                <div className="mt-1 text-muted-foreground">Not available</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {errorDetail.requestData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Additional Details
            </CardTitle>
            <CardDescription>
              Additional context information related to this error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md">
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                {String(errorDetail.requestData)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ErrorDetails; 