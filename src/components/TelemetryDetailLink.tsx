import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppAuth } from "@/lib/useAppAuth";
import { canViewTelemetryDetails } from "@/utils/roleUtils";

interface TelemetryDetailLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
}

export default function TelemetryDetailLink({
  to, children, className = "text-primary hover:underline", fallback,
}: TelemetryDetailLinkProps) {
  const { keycloak } = useAppAuth();
  if (!canViewTelemetryDetails(keycloak)) {
    return <>{fallback === undefined ? children : fallback}</>;
  }
  return <Link to={to} className={className}>{children}</Link>;
}
