import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import './index.css'
import keycloak from './lib/keycloak'

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Initializing Application</h2>
    <p className="text-muted-foreground text-center max-w-md">
      Please wait while we set up your secure connection...
    </p>
  </div>
);

// Error component for initialization failures
const InitializationError = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-background flex flex-col justify-center items-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Connection Error</h2>
    <p className="text-muted-foreground text-center max-w-md mb-4">
      Unable to connect to authentication service. Please try refreshing the page.
    </p>
    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
      Error: {error}
    </p>
    <button 
      onClick={() => window.location.reload()} 
      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
    >
      Retry
    </button>
  </div>
);

// Initialize Keycloak and render the app
createRoot(document.getElementById("root")!).render(
  <ReactKeycloakProvider 
    authClient={keycloak} 
    initOptions={{
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
      // Add timeout to prevent hanging
      timeout: 30000, // 30 seconds timeout
      // Silent check for better UX
      silentCheckSsoFallback: false,
      // Enable adapter logging in development
      enableLogging: import.meta.env.DEV,
    }}
    LoadingComponent={<LoadingSpinner />}
  >
    <App />
  </ReactKeycloakProvider>
)