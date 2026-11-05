import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { fetchAuthMe, switchUserRole } from '../api';

interface AuthContextType {
  currentUser: UserProfile | null;
  activeRole: UserRole;
  demoUsers: UserProfile[];
  availableRoles: Record<string, { label: string; permissions: string[] }>;
  switchRole: (role: UserRole, userId?: string) => Promise<void>;
  policyVersion: string;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  activeRole: 'ADMINISTRATOR',
  demoUsers: [],
  availableRoles: {},
  switchRole: async () => {},
  policyVersion: 'v2.4-STANDARD',
  isLoading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('ADMINISTRATOR');
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Record<string, { label: string; permissions: string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadAuth = async () => {
    try {
      setIsLoading(true);
      const res = await fetchAuthMe();
      if (res.ok) {
        if (res.user) {
          setCurrentUser(res.user);
          setActiveRole(res.user.role);
        } else if (res.default_user) {
          setCurrentUser(res.default_user);
          setActiveRole(res.default_user.role || 'ADMINISTRATOR');
        }
        if (res.demo_users) {
          setDemoUsers(res.demo_users);
        }
        if (res.available_roles) {
          setAvailableRoles(res.available_roles);
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuth();
  }, []);

  const handleSwitchRole = async (role: UserRole, userId?: string) => {
    try {
      setIsLoading(true);
      const res = await switchUserRole(role, userId);
      if (res.ok && res.user) {
        setCurrentUser(res.user);
        setActiveRole(res.user.role);
        if (res.token) {
          localStorage.setItem('guardian_token', res.token);
        }
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        demoUsers,
        availableRoles,
        switchRole: handleSwitchRole,
        policyVersion: 'v2.4-STANDARD',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
