"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { refreshToken as refreshTokenAPI, logout as logoutAPI } from "../services/auth.service";

export type UserRole = "CLIENT" | "HOTEL_OWNER" | "ADMIN";
export type BrowsingMode = "CLIENT" | "OWNER";

interface JwtPayload {
  sub: string;
  userId: number;
  roles: string[];
  exp: number;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  userId: number | null;
  role: UserRole | null;
  browsingMode: BrowsingMode;
  isAuthenticated: boolean;
  emailVerified: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  expiresAt: string | null;
  expiresIn: number | null;
  login: (token: string, refreshToken?: string, userIdFromResponse?: number, expiresAt?: string, expiresIn?: number) => void;
  logout: () => Promise<void>;
  updateEmailVerified: (verified: boolean) => void;
  refreshAccessToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
  getTimeUntilExpiry: () => number;
  setBrowsingMode: (mode: BrowsingMode) => void;
  isOwnerMode: () => boolean;
  setHydrated: (hydrated: boolean) => void;
}

// Helper to get initial state from localStorage
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      token: null,
      refreshToken: null,
      username: null,
      userId: null,
      role: null,
      browsingMode: "CLIENT" as BrowsingMode,
      isAuthenticated: false,
      isHydrated: false,
    };
  }

  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const storedUserId = localStorage.getItem("userId");
  const userId = storedUserId ? parseInt(storedUserId, 10) : null;

  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        console.log('⚠️ Token expired on init, will refresh');
        return {
          token,
          refreshToken,
          username: decoded.sub,
          userId: decoded.userId || userId,
          role: decoded.roles[0]?.replace("ROLE_", "") as UserRole,
          browsingMode: (localStorage.getItem("browsingMode") as BrowsingMode) || "CLIENT",
          isAuthenticated: false, // Mark as not authenticated until refresh
          isHydrated: true,
        };
      }

      const role = decoded.roles[0]?.replace("ROLE_", "") as UserRole;
      const savedMode = localStorage.getItem("browsingMode") as BrowsingMode;
      const browsingMode = (role === "HOTEL_OWNER" && savedMode) ? savedMode : "CLIENT";

      console.log('✅ Token valid on init:', { username: decoded.sub, role });
      return {
        token,
        refreshToken,
        username: decoded.sub,
        userId: decoded.userId || userId,
        role,
        browsingMode,
        isAuthenticated: true,
        isHydrated: true,
      };
    } catch (error) {
      console.error('❌ Failed to decode stored token:', error);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
    }
  }

  console.log('ℹ️ No valid token on init');
  return {
    token: null,
    refreshToken: null,
    username: null,
    userId: null,
    role: null,
    browsingMode: "CLIENT" as BrowsingMode,
    isAuthenticated: false,
    isHydrated: true,
  };
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialState.token,
  refreshToken: initialState.refreshToken,
  username: initialState.username,
  userId: initialState.userId,
  role: initialState.role,
  browsingMode: initialState.browsingMode,
  isAuthenticated: initialState.isAuthenticated,
  emailVerified: false,
  isLoading: false,
  isHydrated: initialState.isHydrated,
  expiresAt: null,
  expiresIn: null,

  setHydrated: (hydrated: boolean) => {
    set({ isHydrated: hydrated });
  },

  login: (token: string, refreshToken?: string, userIdFromResponse?: number, expiresAt?: string, expiresIn?: number) => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const role = decoded.roles[0]?.replace("ROLE_", "") as UserRole;
      const userId = decoded.userId || userIdFromResponse || null;

      if (typeof window !== 'undefined') {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        if (userId) {
          localStorage.setItem("userId", String(userId));
        }
        if (expiresAt) {
          localStorage.setItem("expiresAt", expiresAt);
        }
        if (expiresIn) {
          localStorage.setItem("expiresIn", String(expiresIn));
        }
        
        // Also set token in cookie for middleware access
        document.cookie = `token=${token}; path=/; max-age=${expiresIn || 300}; SameSite=Lax`;
      }

      const savedMode = typeof window !== 'undefined' ? localStorage.getItem("browsingMode") as BrowsingMode : null;
      const browsingMode = (role === "HOTEL_OWNER" && savedMode) ? savedMode : "CLIENT";

      set({
        token,
        refreshToken: refreshToken || null,
        username: decoded.sub,
        userId,
        role,
        browsingMode,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
        expiresAt: expiresAt || null,
        expiresIn: expiresIn || null,
      });

      console.log('✅ Auth store updated:', { username: decoded.sub, role, userId, browsingMode, expiresIn, expiresAt });
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      get().logout();
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    
    set({ isLoading: true });
    
    try {
      await logoutAPI(refreshToken || undefined);
    } catch (error) {
      console.error('❌ Logout API error:', error);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("browsingMode");
      localStorage.removeItem("expiresAt");
      localStorage.removeItem("expiresIn");
      
      // Clear token cookie
      document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    }
    
    set({
      token: null,
      refreshToken: null,
      username: null,
      userId: null,
      role: null,
      browsingMode: "CLIENT",
      isAuthenticated: false,
      emailVerified: false,
      isLoading: false,
      isHydrated: true,
      expiresAt: null,
      expiresIn: null,
    });

    console.log('✅ Logged out successfully');
  },

  updateEmailVerified: (verified: boolean) => {
    set({ emailVerified: verified });
  },

  setBrowsingMode: (mode: BrowsingMode) => {
    const { role } = get();
    if (role === "HOTEL_OWNER") {
      if (typeof window !== 'undefined') {
        localStorage.setItem("browsingMode", mode);
      }
      set({ browsingMode: mode });
      console.log('✅ Browsing mode changed to:', mode);
    }
  },

  isOwnerMode: (): boolean => {
    const { role, browsingMode } = get();
    return role === "HOTEL_OWNER" && browsingMode === "OWNER";
  },

  refreshAccessToken: async (): Promise<boolean> => {
    const { refreshToken: currentRefreshToken } = get();
    
    if (!currentRefreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Refreshing access token...');
      const response = await refreshTokenAPI(currentRefreshToken);
      
      const newToken = response.accessToken;
      const newRefreshToken = response.refreshToken;
      const expiresAt = response.expiresAt;
      const expiresIn = response.expiresIn;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        if (expiresAt) {
          localStorage.setItem("expiresAt", expiresAt);
        }
        if (expiresIn) {
          localStorage.setItem("expiresIn", String(expiresIn));
        }
      }

      const decoded = jwtDecode<JwtPayload>(newToken);
      const role = decoded.roles[0]?.replace("ROLE_", "") as UserRole;

      set({
        token: newToken,
        refreshToken: newRefreshToken || currentRefreshToken,
        username: decoded.sub,
        userId: decoded.userId,
        role,
        isAuthenticated: true,
        isHydrated: true,
        expiresAt: expiresAt || null,
        expiresIn: expiresIn || null,
      });

      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await get().logout();
      return false;
    }
  },

  isTokenExpired: (): boolean => {
    const { token } = get();
    if (!token) return true;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('❌ Failed to decode token for expiry check:', error);
      return true;
    }
  },

  getTimeUntilExpiry: (): number => {
    const { token } = get();
    if (!token) return 0;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      console.error('❌ Failed to decode token for expiry time:', error);
      return 0;
    }
  },
}));

// Hydration hook - handles token refresh if needed
export const useHydrateAuth = () => {
  const { token, refreshToken, refreshAccessToken, logout, isAuthenticated, setHydrated } = useAuthStore();

  useEffect(() => {
    // Set hydrated on client mount if not already
    if (typeof window !== 'undefined') {
      const currentState = useAuthStore.getState();
      if (!currentState.isHydrated) {
        // Re-read from localStorage on client
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedUserId = localStorage.getItem("userId");
        
        if (storedToken) {
          try {
            const decoded = jwtDecode<JwtPayload>(storedToken);
            const currentTime = Date.now() / 1000;
            
            if (decoded.exp >= currentTime) {
              const role = decoded.roles[0]?.replace("ROLE_", "") as UserRole;
              const savedMode = localStorage.getItem("browsingMode") as BrowsingMode;
              const browsingMode = (role === "HOTEL_OWNER" && savedMode) ? savedMode : "CLIENT";
              
              useAuthStore.setState({
                token: storedToken,
                refreshToken: storedRefreshToken,
                username: decoded.sub,
                userId: decoded.userId || (storedUserId ? parseInt(storedUserId, 10) : null),
                role,
                browsingMode,
                isAuthenticated: true,
                isHydrated: true,
              });
              console.log('✅ Auth hydrated on client mount');
              return;
            }
          } catch (e) {
            console.error('❌ Token decode error on hydrate:', e);
          }
        }
        setHydrated(true);
      }
    }
  }, [setHydrated]);

  // Handle expired token refresh
  useEffect(() => {
    const handleExpiredToken = async () => {
      if (!token || isAuthenticated) return;
      
      // Token exists but not authenticated = expired token
      if (refreshToken) {
        console.log('🔄 Attempting to refresh expired token...');
        const success = await refreshAccessToken();
        if (!success) {
          console.log('❌ Refresh failed, clearing auth');
          await logout();
        }
      } else {
        console.log('❌ No refresh token, clearing auth');
        await logout();
      }
    };

    handleExpiredToken();
  }, [token, refreshToken, isAuthenticated, refreshAccessToken, logout]);
};

// Auto-refresh hook
export const useAutoRefresh = () => {
  const { isAuthenticated, getTimeUntilExpiry, refreshAccessToken, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefresh = async () => {
      const timeUntilExpiry = getTimeUntilExpiry();
      
      if (timeUntilExpiry > 0 && timeUntilExpiry < 300) {
        console.log('🔄 Token expiring soon, refreshing...');
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          console.log('❌ Auto-refresh failed, logging out');
          await logout();
        }
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeUntilExpiry, refreshAccessToken, logout]);
};
