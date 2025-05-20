
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import Content from "./pages/Content";
import ServiceStatus from "./pages/ServiceStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* <Route path="/" element={
              <Layout>
                <Dashboard />
              </Layout>
            } /> */}
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
