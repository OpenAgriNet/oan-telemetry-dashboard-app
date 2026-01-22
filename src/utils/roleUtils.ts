import { KeycloakInstance } from "keycloak-js";

/**
 * Check if the current user has a specific realm role
 * @param keycloak - Keycloak instance
 * @param role - The role name to check
 * @returns boolean indicating if user has the role
 */
export const hasRealmRole = (keycloak: KeycloakInstance, role: string): boolean => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return false;
  }

  // Check realm roles from the token
  const realmAccess = keycloak.tokenParsed.realm_access;
  return realmAccess?.roles?.includes(role) || false;
};

/**
 * Check if the current user has a specific client role
 * @param keycloak - Keycloak instance
 * @param clientId - The client ID
 * @param role - The role name to check
 * @returns boolean indicating if user has the role
 */
export const hasClientRole = (
  keycloak: KeycloakInstance,
  clientId: string,
  role: string
): boolean => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return false;
  }

  // Check client roles from the token
  const resourceAccess = keycloak.tokenParsed.resource_access;
  return resourceAccess?.[clientId]?.roles?.includes(role) || false;
};

/**
 * Check if the current user is a super admin
 * @param keycloak - Keycloak instance
 * @returns boolean indicating if user is a super admin
 */
export const isSuperAdmin = (keycloak: KeycloakInstance): boolean => {
  console.log("keycloak", keycloak);
  return hasRealmRole(keycloak, "super-admin");
}; 