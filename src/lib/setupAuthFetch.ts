import keycloak from './keycloak';
import { API_CONFIG } from '../config/environment';

// Install a global fetch wrapper that attaches Keycloak JWT to backend API requests
export function setupAuthFetch(): void {
  if ((window as any).__authFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Resolve URL string from input
      const url = typeof input === 'string'
        ? input
        : (input instanceof URL ? input.toString() : input.url);

      const shouldAttachAuth =
        typeof url === 'string' &&
        API_CONFIG.SERVER_URL &&
        url.startsWith(API_CONFIG.SERVER_URL);

      if (shouldAttachAuth && keycloak?.authenticated) {
        // Refresh token if close to expiry; ignore errors to avoid blocking requests
        try {
          await keycloak.updateToken(30);
        } catch {
          // Best-effort; if refresh fails, continue with existing token
        }

        const token = keycloak?.token;
        if (token) {
          const mergedHeaders = new Headers(
            init?.headers || (input instanceof Request ? input.headers : undefined) || {}
          );
          mergedHeaders.set('Authorization', `Bearer ${token}`);

          const newInit: RequestInit = { ...init, headers: mergedHeaders };

          if (input instanceof Request) {
            // Recreate Request to apply new headers
            const reqWithAuth = new Request(input, newInit);
            return originalFetch(reqWithAuth);
          }
          return originalFetch(url, newInit);
        }
      }
    } catch {
      // In case of any wrapper error, fall back to the original fetch
    }

    return originalFetch(input as any, init as any);
  };

  (window as any).__authFetchInstalled = true;
}


