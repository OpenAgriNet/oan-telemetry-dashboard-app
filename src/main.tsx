import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import './index.css'
import keycloak from './lib/keycloak'
import { setupAuthFetch } from './lib/setupAuthFetch'

setupAuthFetch();
createRoot(document.getElementById("root")!).render(
 
    <ReactKeycloakProvider 
      authClient={keycloak} 
      initOptions={{
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256'
      }}>
      <App />
    </ReactKeycloakProvider>
 
)