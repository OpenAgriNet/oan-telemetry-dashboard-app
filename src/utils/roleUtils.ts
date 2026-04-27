import { KeycloakInstance } from "keycloak-js";

export type TelemetryStateId = "bharat-vistaar" | "bihar-krishi";

export interface TelemetryStateConfig {
  id: TelemetryStateId;
  label: string;
  adminRole: string;
  chatTelemetryTabs: Array<
    "dashboard" | "users" | "sessions" | "questions" | "feedback" | "errors" | "asr" | "tts"
  >;
  showUnifiedMetrics: boolean;
}

export const TELEMETRY_STATES: Record<TelemetryStateId, TelemetryStateConfig> = {
  "bharat-vistaar": {
    id: "bharat-vistaar",
    label: "Bharat Vistaar",
    adminRole: "admin-bharat",
    chatTelemetryTabs: [
      "dashboard",
      "users",
      "sessions",
      "questions",
      "feedback",
      "errors",
      "asr",
      "tts",
    ],
    showUnifiedMetrics: true,
  },
  "bihar-krishi": {
    id: "bihar-krishi",
    label: "Bihar Krishi",
    adminRole: "admin-bihar",
    chatTelemetryTabs: [
      "dashboard",
      "users",
      "sessions",
      "questions",
      "feedback",
      "errors",
    ],
    showUnifiedMetrics: false,
  },
};

export const TELEMETRY_STATE_ORDER: TelemetryStateId[] = [
  "bharat-vistaar",
  "bihar-krishi",
];

export const TELEMETRY_STATE_STORAGE_KEY = "telemetry:selected-state";

export const hasRealmRole = (keycloak: KeycloakInstance, role: string): boolean => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return false;
  }

  const realmAccess = keycloak.tokenParsed.realm_access;
  return realmAccess?.roles?.includes(role) || false;
};

export const isSuperAdmin = (keycloak: KeycloakInstance): boolean => {
  return hasRealmRole(keycloak, "super-admin");
};

export const getAllowedTelemetryStates = (
  keycloak: KeycloakInstance,
): TelemetryStateConfig[] => {
  if (isSuperAdmin(keycloak)) {
    return TELEMETRY_STATE_ORDER.map((id) => TELEMETRY_STATES[id]);
  }

  return TELEMETRY_STATE_ORDER
    .map((id) => TELEMETRY_STATES[id])
    .filter((state) => hasRealmRole(keycloak, state.adminRole));
};

export const canAccessTelemetryState = (
  keycloak: KeycloakInstance,
  stateId: TelemetryStateId,
): boolean => {
  if (isSuperAdmin(keycloak)) {
    return true;
  }

  const config = TELEMETRY_STATES[stateId];
  return !!config && hasRealmRole(keycloak, config.adminRole);
};

export const getDefaultTelemetryState = (
  keycloak: KeycloakInstance,
): TelemetryStateConfig | null => {
  const allowedStates = getAllowedTelemetryStates(keycloak);
  return allowedStates[0] ?? null;
};

export const canAccessTabForState = (
  stateId: TelemetryStateId,
  tab:
    | "dashboard"
    | "users"
    | "sessions"
    | "questions"
    | "feedback"
    | "errors"
    | "asr"
    | "tts",
): boolean => {
  return TELEMETRY_STATES[stateId].chatTelemetryTabs.includes(tab);
};
