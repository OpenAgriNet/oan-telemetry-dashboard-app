
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import keycloak from '../config/keycloak';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {},
  hasRole: () => false
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          pkceMethod: 'S256'
        });

        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userProfile = await keycloak.loadUserProfile();
          setUser({
            ...userProfile,
            roles: keycloak.realmAccess?.roles || []
          });
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
        toast({
          title: "Authentication Error",
          description: "Failed to connect to authentication service",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();

    return () => {
      // Cleanup
    };
  }, [toast]);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  const hasRole = (role: string): boolean => {
    return keycloak.hasRealmRole(role);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
