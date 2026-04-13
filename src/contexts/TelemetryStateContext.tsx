import React, { createContext, useContext, useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useQueryClient } from "@tanstack/react-query";
import {
  TELEMETRY_STATES,
  TELEMETRY_STATE_STORAGE_KEY,
  type TelemetryStateConfig,
  type TelemetryStateId,
  getAllowedTelemetryStates,
  getDefaultTelemetryState,
  isSuperAdmin,
} from "@/utils/roleUtils";

interface TelemetryStateContextValue {
  allowedStates: TelemetryStateConfig[];
  selectedState: TelemetryStateConfig | null;
  selectedStateId: TelemetryStateId | null;
  isSuper: boolean;
  setSelectedStateId: (stateId: TelemetryStateId) => void;
}

const TelemetryStateContext = createContext<
  TelemetryStateContextValue | undefined
>(undefined);

export const useTelemetryState = () => {
  const context = useContext(TelemetryStateContext);

  if (!context) {
    throw new Error(
      "useTelemetryState must be used within a TelemetryStateProvider",
    );
  }

  return context;
};

interface TelemetryStateProviderProps {
  children: React.ReactNode;
}

export const TelemetryStateProvider: React.FC<TelemetryStateProviderProps> = ({
  children,
}) => {
  const { keycloak } = useKeycloak();
  const queryClient = useQueryClient();
  const allowedStates = getAllowedTelemetryStates(keycloak);
  const defaultState = getDefaultTelemetryState(keycloak);
  const [selectedStateId, setSelectedStateIdState] =
    useState<TelemetryStateId | null>(defaultState?.id ?? null);

  useEffect(() => {
    const allowedStateIds = allowedStates.map((state) => state.id);
    const storedStateId =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(
            TELEMETRY_STATE_STORAGE_KEY,
          ) as TelemetryStateId | null)
        : null;

    const nextStateId =
      storedStateId && allowedStateIds.includes(storedStateId)
        ? storedStateId
        : defaultState?.id ?? null;

    setSelectedStateIdState((currentStateId) => {
      if (currentStateId && allowedStateIds.includes(currentStateId)) {
        return currentStateId;
      }

      return nextStateId;
    });
  }, [defaultState?.id, allowedStates.map((state) => state.id).join("|")]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedStateId) {
      return;
    }

    window.localStorage.setItem(TELEMETRY_STATE_STORAGE_KEY, selectedStateId);
    queryClient.invalidateQueries();
  }, [queryClient, selectedStateId]);

  const setSelectedStateId = (stateId: TelemetryStateId) => {
    if (!allowedStates.some((state) => state.id === stateId)) {
      return;
    }

    setSelectedStateIdState(stateId);
  };

  const selectedState = selectedStateId
    ? TELEMETRY_STATES[selectedStateId]
    : null;

  return (
    <TelemetryStateContext.Provider
      value={{
        allowedStates,
        selectedState,
        selectedStateId,
        isSuper: isSuperAdmin(keycloak),
        setSelectedStateId,
      }}
    >
      {children}
    </TelemetryStateContext.Provider>
  );
};
