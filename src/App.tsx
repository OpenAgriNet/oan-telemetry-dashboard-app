import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DateFilterProvider } from "@/contexts/DateFilterContext";
import { StatsProvider } from "@/contexts/StatsContext";
import {
  TelemetryStateProvider,
  useTelemetryState,
} from "@/contexts/TelemetryStateContext";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
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
import { useKeycloak } from "@react-keycloak/web";
import QuestionsDetails from "./pages/QuestionsDetails";
import {
  canAccessTabForState,
  isSuperAdmin,
} from "@/utils/roleUtils";
import DeviceReport from "./pages/DeviceReport";
import AsrReport from "./pages/AsrReport";
import TtsReport from "./pages/TtsReport";
import CallsReport from "./pages/CallsReport";
import CallDetails from "./pages/CallDetails";
import CombinedDashboard from "./pages/CombinedDashboard";
import LangfuseQuestions from "./pages/LangfuseQuestions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type ChatTelemetryTab =
  | "dashboard"
  | "users"
  | "sessions"
  | "questions"
  | "feedback"
  | "errors"
  | "asr"
  | "tts";

const AccessDenied = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
    <div className="max-w-md text-center space-y-3">
      <h1 className="text-2xl font-semibold">Access Restricted</h1>
      <p className="text-muted-foreground">
        Your current role does not have access to any telemetry state in this
        environment.
      </p>
    </div>
  </div>
);

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <Layout>{children}</Layout>
);

const TelemetryRoute = ({
  children,
  requiredTab,
}: {
  children: React.ReactNode;
  requiredTab: ChatTelemetryTab;
}) => {
  const { selectedState } = useTelemetryState();

  if (!selectedState) {
    return <AccessDenied />;
  }

  if (!canAccessTabForState(selectedState.id, requiredTab)) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { keycloak } = useKeycloak();

  if (!isSuperAdmin(keycloak)) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const { allowedStates } = useTelemetryState();

  if (allowedStates.length === 0) {
    return <AccessDenied />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <TelemetryRoute requiredTab="dashboard">
            <Dashboard />
          </TelemetryRoute>
        }
      />
      <Route
        path="/users"
        element={
          <TelemetryRoute requiredTab="users">
            <DeviceReport />
          </TelemetryRoute>
        }
      />
      <Route path="/devices" element={<Navigate to="/users" replace />} />
      <Route
        path="/sessions"
        element={
          <TelemetryRoute requiredTab="sessions">
            <SessionsReport />
          </TelemetryRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <TelemetryRoute requiredTab="questions">
            <QuestionsReport />
          </TelemetryRoute>
        }
      />
      <Route
        path="/questions/:id"
        element={
          <TelemetryRoute requiredTab="questions">
            <QuestionsDetails />
          </TelemetryRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <AppLayout>
            <Analytics />
          </AppLayout>
        }
      />
      <Route
        path="/sessions/:sessionId"
        element={
          <TelemetryRoute requiredTab="sessions">
            <SessionDetails />
          </TelemetryRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <TelemetryRoute requiredTab="feedback">
            <Feedback />
          </TelemetryRoute>
        }
      />
      <Route
        path="/feedback/:feedbackId"
        element={
          <TelemetryRoute requiredTab="feedback">
            <FeedbackDetails />
          </TelemetryRoute>
        }
      />
      <Route
        path="/errors"
        element={
          <TelemetryRoute requiredTab="errors">
            <Errors />
          </TelemetryRoute>
        }
      />
      <Route
        path="/errors/:errorId"
        element={
          <TelemetryRoute requiredTab="errors">
            <ErrorDetails />
          </TelemetryRoute>
        }
      />
      <Route
        path="/asr"
        element={
          <TelemetryRoute requiredTab="asr">
            <AsrReport />
          </TelemetryRoute>
        }
      />
      <Route
        path="/tts"
        element={
          <TelemetryRoute requiredTab="tts">
            <TtsReport />
          </TelemetryRoute>
        }
      />
      <Route
        path="/calls"
        element={
          <SuperAdminRoute>
            <CallsReport />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/combined-dashboard"
        element={
          <SuperAdminRoute>
            <CombinedDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/calls/*"
        element={
          <SuperAdminRoute>
            <CallDetails />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/content"
        element={
          <AppLayout>
            <Content />
          </AppLayout>
        }
      />
      <Route
        path="/service-status"
        element={
          <SuperAdminRoute>
            <ServiceStatus />
          </SuperAdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <div className=" bg-foreground/80 flex justify-center items-center h-screen text-background">
        Loading...
      </div>
    );
  }

  if (!keycloak.authenticated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DateFilterProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <TelemetryStateProvider>
                <StatsProvider>
                  <AppRoutes />
                </StatsProvider>
              </TelemetryStateProvider>
            </BrowserRouter>
          </TooltipProvider>
        </DateFilterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
