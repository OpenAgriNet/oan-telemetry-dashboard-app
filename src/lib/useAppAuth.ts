import { useKeycloak } from "@react-keycloak/web";
import type { KeycloakInstance } from "keycloak-js";

export const localAuthBypass =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH_BYPASS === "true";

const localKeycloak = {
  authenticated: true,
  tokenParsed: {
    preferred_username: "local-evaluation",
    realm_access: { roles: ["super-admin"] },
  },
  logout: async () => undefined,
  updateToken: async () => true,
} as unknown as KeycloakInstance;

export function useAppAuth(): { keycloak: KeycloakInstance; initialized: boolean } {
  if (localAuthBypass) {
    return { keycloak: localKeycloak, initialized: true };
  }

  return useKeycloak();
}
