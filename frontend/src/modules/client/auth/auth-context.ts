/**
 * PeerCove Auth Context
 * Manages user role, profile data, and demo mode state globally
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type { MemberProfile, ListenerProfile } from "../../../../prisma/generated/prisma/models";

export type UserRole = "member" | "listener" | "admin";

export interface PeerCoveAuthContextType {
  userId: string | null;
  userRole: UserRole | null;
  displayName: string | null;
  memberProfile: MemberProfile | null;
  listenerProfile: ListenerProfile | null;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<PeerCoveAuthContextType | undefined>(
  undefined
);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [listenerProfile, setListenerProfile] =
    useState<ListenerProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from session/cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // This would typically fetch from Better Auth or your auth endpoint
        // For now, we'll try to get it from localStorage or session
        const storedRole = localStorage.getItem("userRole") as UserRole | null;
        const storedUserId = localStorage.getItem("userId");
        const storedDisplayName = localStorage.getItem("displayName");
        const storedDemoMode = localStorage.getItem("isDemoMode") === "true";

        if (storedUserId && storedRole) {
          setUserId(storedUserId);
          setUserRole(storedRole);
          setDisplayName(storedDisplayName);
          setIsDemoMode(storedDemoMode);

          // Optionally fetch full profile data
          await refreshProfile();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setError("Failed to load authentication state");
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshProfile = async () => {
    if (!userId || !userRole) return;

    try {
      const endpoint =
        userRole === "member"
          ? `/api/member/profile?userId=${userId}`
          : userRole === "listener"
            ? `/api/listener/profile?userId=${userId}`
            : null;

      if (!endpoint) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch profile");

      const profile = await response.json();

      if (userRole === "member" && profile) {
        setMemberProfile(profile);
      } else if (userRole === "listener" && profile) {
        setListenerProfile(profile);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUserId(null);
    setUserRole(null);
    setDisplayName(null);
    setMemberProfile(null);
    setListenerProfile(null);
    setIsDemoMode(false);
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("displayName");
    localStorage.removeItem("isDemoMode");
  };

  const value: PeerCoveAuthContextType = {
    userId,
    userRole,
    displayName,
    memberProfile,
    listenerProfile,
    isDemoMode,
    isLoading,
    error,
    logout,
    refreshProfile,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
