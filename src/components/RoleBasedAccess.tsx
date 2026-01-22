import React from "react";
import { useKeycloak } from "@react-keycloak/web";
import { hasRealmRole } from "@/utils/roleUtils";
import { AlertTriangle } from "lucide-react";

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Component that conditionally renders children based on user roles
 * @param allowedRoles - Array of realm roles that are allowed to access the content
 * @param children - Content to render if user has required role
 * @param fallback - Optional custom fallback component if access denied
 * @param showAccessDenied - Whether to show default access denied message (default: true)
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback,
  showAccessDenied = true,
}) => {
  const { keycloak } = useKeycloak();

  // Check if user has any of the allowed roles
  const hasAccess = allowedRoles.some((role) => hasRealmRole(keycloak, role));

  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If showAccessDenied is false, render nothing
  if (!showAccessDenied) {
    return null;
  }

  // Default access denied message
  return (
    <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Access Denied</p>
        <p className="text-destructive/80 text-sm">
          You don't have permission to access this content. Required roles: {allowedRoles.join(", ")}
        </p>
      </div>
    </div>
  );
};

export default RoleBasedAccess; 