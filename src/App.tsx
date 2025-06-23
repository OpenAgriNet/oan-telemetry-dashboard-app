import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DateFilterProvider } from "@/contexts/DateFilterContext";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import UsersReport from "./pages/UsersReport";
import SessionsReport from "./pages/SessionsReport";
import QuestionsReport from "./pages/QuestionsReport";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import SessionDetails from "./pages/SessionDetails";
import Feedback from "./pages/Feedback";
import FeedbackDetails from "./pages/FeedbackDetails";
import Errors from "./pages/Errors";
import ErrorDetails from "./pages/ErrorDetails";
import Content from "./pages/Content";
import ServiceStatus from "./pages/ServiceStatus";
import HealthMonitor from "./pages/HealthMonitor";
import { useKeycloak } from "@react-keycloak/web";
import QuestionsDetails from "./pages/QuestionsDetails";
import { isSuperAdmin } from "@/utils/roleUtils";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

// Enhanced loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Loading Dashboard</h2>
    <p className="text-muted-foreground text-center max-w-md">
      Preparing your secure session...
    </p>
  </div>
);

// Authentication error component
const AuthError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Failed</h2>
    <p className="text-muted-foreground text-center max-w-md mb-4">
      There was an issue with your authentication. Please try logging in again.
    </p>
    <button 
      onClick={onRetry}
      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
    >
      Try Again
    </button>
  </div>
);

const App = () => {
  const { keycloak, initialized } = useKeycloak();
  const [authError, setAuthError] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  
  // Handle authentication and role checking
  useEffect(() => {
    // Remove initial loader when React app is ready
    const initialLoader = document.getElementById('initial-loader');
    if (initialLoader) {
      initialLoader.style.display = 'none';
    }

    if (initialized) {
      if (keycloak.authenticated) {
        setAuthError(false);
        // Check super admin status
        setIsSuper(isSuperAdmin(keycloak));
      } else if (keycloak.loginRequired) {
        // Handle login requirement
        setTimeout(() => {
          if (!keycloak.authenticated) {
            setAuthError(true);
          }
        }, 5000); // Show error after 5 seconds if still not authenticated
      }
    }
  }, [keycloak, initialized]);

  // Show loading state while Keycloak is initializing
  if (!initialized) {
    return <LoadingScreen />;
  }
  
  // Show auth error with retry option
  if (authError) {
    return (
      <AuthError 
        onRetry={() => {
          setAuthError(false);
          keycloak.login();
        }} 
      />
    );
  }
  
  // If not authenticated, don't render the app (Keycloak will handle redirect)
  if (!keycloak.authenticated) {
    return <LoadingScreen />;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DateFilterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <Layout>
                  <Dashboard />
                </Layout>
              } />
              <Route path="/users" element={
                <Layout>
                  <UsersReport />
                </Layout>
              } />
              <Route path="/sessions" element={
                <Layout>
                  <SessionsReport />
                </Layout>
              } />
              <Route path="/questions" element={
                <Layout>
                  <QuestionsReport />
                </Layout>
              } />
              <Route path="/questions/:id" element={
                <Layout>
                  <QuestionsDetails />
                </Layout>
              } />
              <Route path="/analytics" element={
                <Layout>
                  <Analytics />
                </Layout>
              } />
              <Route path="/sessions/:sessionId" element={
                <Layout>
                  <SessionDetails />
                </Layout>
              } />
              <Route path="/feedback" element={
                <Layout>
                  <Feedback />
                </Layout>
              } />
              <Route path="/feedback/:feedbackId" element={
                <Layout>
                  <FeedbackDetails />
                </Layout>
              } />
              <Route path="/content" element={
                <Layout>
                  <Content />
                </Layout>
              } />
              <Route path="/service-status" element={
                <Layout>
                  <ServiceStatus />
                </Layout>
              } />
              {/* <Route path="/health-monitor" element={
                <Layout>
                  <HealthMonitor />
                </Layout>
              } /> */}
              {/* Conditionally render error routes for super-admin users only */}
              {isSuper && (
                <>
                  <Route path="/errors" element={
                    <Layout>
                      <Errors />
                    </Layout>
                  } />
                  <Route path="/errors/:errorId" element={
                    <Layout>
                      <ErrorDetails />
                    </Layout>
                  } />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DateFilterProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
};


export default App;
