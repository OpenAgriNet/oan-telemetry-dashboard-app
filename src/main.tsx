import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import './index.css'
import keycloak from './lib/keycloak'
import { setupAuthFetch } from './lib/setupAuthFetch'
import { localAuthBypass } from './lib/useAppAuth'

setupAuthFetch();
const application = localAuthBypass ? <App /> : (
    <ReactKeycloakProvider 
      authClient={keycloak} 
      initOptions={{
        onLoad: 'login-required',
        // The deployed Keycloak client has a dashboard URL as its default.
        // During Vite development, explicitly return users to the local app
        // after authentication instead of that deployed default.
        redirectUri: import.meta.env.DEV ? window.location.href : undefined,
        checkLoginIframe: false,
        pkceMethod: 'S256'
      }}>
      <App />
    </ReactKeycloakProvider>
);

createRoot(document.getElementById("root")!).render(application)
