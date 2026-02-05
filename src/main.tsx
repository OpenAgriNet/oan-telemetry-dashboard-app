import { createRoot } from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import './index.css'
import keycloak, { isKeycloakConfigValid } from './lib/keycloak'
import { setupAuthFetch } from './lib/setupAuthFetch'

// Explicit redirect URI = app origin (prevents redirect loop; must match Keycloak client config)
const redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined;

setupAuthFetch();

function ConfigError() {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      maxWidth: '32rem',
      margin: '4rem auto',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
    }}>
      <h2 style={{ color: '#b91c1c', marginTop: 0 }}>Invalid Auth Configuration</h2>
      <p>Keycloak URL, realm, and client ID must be set at build time. Set these env vars and rebuild:</p>
      <pre style={{ background: '#fff', padding: '1rem', overflow: 'auto', fontSize: '0.875rem' }}>
        {`VITE_KEYCLOAK_URL=https://auth.example.com
VITE_KEYCLOAK_REALM=your-realm
VITE_KEYCLOAK_CLIENT_ID=your-client-id`}
      </pre>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  isKeycloakConfigValid() ? (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
        ...(redirectUri && { redirectUri }),
      }}
    >
      <App />
    </ReactKeycloakProvider>
  ) : (
    <ConfigError />
  )
)