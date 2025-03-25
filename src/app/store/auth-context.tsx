"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Function to refresh the auth state
  const refreshAuthState = useCallback(async () => {
    try {
      // Get current session
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      setSession(currentSession);
      setUser(currentSession?.user || null);
    } catch (err) {
      console.error("Error refreshing auth state:", err);
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Initialize auth state on mount
  useEffect(() => {
    // First load - get the session
    refreshAuthState();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      setSession(newSession);
      setUser(newSession?.user || null);
      setIsLoading(false);
    });

    // Handle tab visibility changes for better session synchronization
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, refreshing auth state");
        refreshAuthState();
      }
    };

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase.auth, refreshAuthState]);

  // Sign in with magic link
  const signInWithMagicLink = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // On success, show a notification or redirect
    } catch (err) {
      console.error("Error signing in with magic link:", err);
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear session and user state
      setSession(null);
      setUser(null);

      // Redirect to sign-in page
      router.push("/auth/sign-in");
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err as AuthError);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide auth context value
  const value = {
    session,
    user,
    isLoading,
    error,
    signInWithMagicLink,
    signOut,
    refreshAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
