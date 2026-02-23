import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import { ThemeProvider } from '@/contexts/ThemeContext'
import App from './App.tsx'
import ChatHealthStatusPage from './pages/ChatHealthStatus'
import './index.css'
import keycloak from './lib/keycloak'
import { setupAuthFetch } from './lib/setupAuthFetch'

const publicQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

setupAuthFetch();
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* Public status page — no auth required */}
      <Route
        path="/status"
        element={
          <QueryClientProvider client={publicQueryClient}>
            <ThemeProvider>
              <ChatHealthStatusPage />
            </ThemeProvider>
          </QueryClientProvider>
        }
      />
      {/* Everything else goes through Keycloak */}
      <Route
        path="/*"
        element={
          <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{
              onLoad: 'login-required',
              checkLoginIframe: false,
              pkceMethod: 'S256',
            }}
          >
            <App />
          </ReactKeycloakProvider>
        }
      />
    </Routes>
  </BrowserRouter>
)