import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DateFilterProvider } from "@/contexts/DateFilterContext";
import { StatsProvider } from "@/contexts/StatsContext";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import UsersReport from "./pages/UsersReport";
import SessionsReport from "./pages/SessionsReport";
import QuestionsReport from "./pages/QuestionsReport";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Feedback from "./pages/Feedback";
import Errors from "./pages/Errors";
import ErrorDetails from "./pages/ErrorDetails";
import Content from "./pages/Content";
import ServiceStatus from "./pages/ServiceStatus";
import HealthMonitor from "./pages/HealthMonitor";
import { useAppAuth } from "@/lib/useAppAuth";
import { TELEMETRY_DETAIL_ROLE } from "@/utils/roleUtils";
import RoleBasedAccess from "@/components/RoleBasedAccess";
import SessionDetails from "./pages/SessionDetails";
import QuestionsDetails from "./pages/QuestionsDetails";
import FeedbackDetails from "./pages/FeedbackDetails";
import Evaluation from "./pages/Evaluation";
import EvaluationDetails from "./pages/EvaluationDetails";
import EvaluationRunAdmin from "./pages/EvaluationRunAdmin";
import ServiceSnapshot from "./pages/ServiceSnapshot";
import ServiceSnapshotProvider from "./pages/ServiceSnapshotProvider";
import ServiceSnapshotDetail from "./pages/ServiceSnapshotDetail";
import IndividualApiCalls from "./pages/IndividualApiCalls";
import IndividualApiCallDetail from "./pages/IndividualApiCallDetail";
import ServiceApiCalls from "./pages/ServiceApiCalls";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const { keycloak, initialized } = useAppAuth();
  
  // Show loading state while Keycloak is initializing
  if (!initialized) {
    return <div className=" bg-foreground/80 flex justify-center items-center h-screen text-background">Loading...</div>;
  }
  
  // If not authenticated, don't render the app
  if (!keycloak.authenticated) {
    return null;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DateFilterProvider>
        <StatsProvider>
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
              <Route path="/" element={
                <Layout>
                  <UsersReport />
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
              <Route path="/sessions/:sessionId" element={<Layout><RoleBasedAccess allowedRoles={[TELEMETRY_DETAIL_ROLE]}><SessionDetails /></RoleBasedAccess></Layout>} />
              <Route path="/questions/:id" element={<Layout><RoleBasedAccess allowedRoles={[TELEMETRY_DETAIL_ROLE]}><QuestionsDetails /></RoleBasedAccess></Layout>} />
              <Route path="/feedback/:feedbackId" element={<Layout><RoleBasedAccess allowedRoles={[TELEMETRY_DETAIL_ROLE]}><FeedbackDetails /></RoleBasedAccess></Layout>} />
              <Route path="/errors/:errorId" element={<Layout><RoleBasedAccess allowedRoles={[TELEMETRY_DETAIL_ROLE]}><ErrorDetails /></RoleBasedAccess></Layout>} />
              <Route path="/analytics" element={
                <Layout>
                  <Analytics />
                </Layout>
              } />
              <Route path="/feedback" element={
                <Layout>
                  <Feedback />
                </Layout>
              } />
              {/* OD-3109: Keep Evaluation routes available to re-enable later. */}
              {/*
              <Route path="/evaluation" element={<Layout><Evaluation /></Layout>} />
              <Route path="/evaluation/runs" element={<Layout><EvaluationRunAdmin /></Layout>} />
              <Route path="/evaluation/runs/new" element={<Layout><EvaluationRunAdmin /></Layout>} />
              <Route path="/evaluation/:runId/:itemId" element={<Layout><EvaluationDetails /></Layout>} />
              */}
              <Route path="/content" element={
                <Layout>
                  <Content />
                </Layout>
              } />
              {/* OD-3109: Keep Service Status disabled until explicitly re-enabled. */}
              {/* <Route path="/service-status" element={
                <Layout>
                  <ServiceStatus />
                </Layout>
              } /> */}
              <Route path="/service-snapshot" element={<Layout><ServiceSnapshot /></Layout>} />
              <Route path="/service-snapshot/provider/:providerName" element={<Layout><ServiceSnapshotProvider /></Layout>} />
              <Route path="/service-snapshot/provider/:providerName/service/:serviceKey" element={<Layout><ServiceSnapshotDetail /></Layout>} />
              <Route path="/service-snapshot/provider/:providerName/service/:serviceKey/api/:apiKey" element={<Layout><ServiceApiCalls /></Layout>} />
              <Route path="/individual-apis" element={<Layout><IndividualApiCalls /></Layout>} />
              <Route path="/individual-apis/:id" element={<Layout><IndividualApiCallDetail /></Layout>} />
              {/* <Route path="/health-monitor" element={
                <Layout>
                  <HealthMonitor />
                </Layout>
              } /> */}
              {/* All authenticated users can view the report; detail routes remain role-gated. */}
              <Route path="/errors" element={
                <Layout>
                  <Errors />
                </Layout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </StatsProvider>
      </DateFilterProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
};


export default App;
