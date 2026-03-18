import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "creator" | "client" | "trade_partner";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_initials: string | null;
  email: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isCreator: boolean;
  isTradePartner: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ── DEV AUTH BYPASS ─────────────────────────────────────────────────────
// Set to true to skip login and act as a mock creator user.
// TODO: Remove before production deployment.
const DEV_BYPASS_AUTH = false;

const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@homeclarityhub.com",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: { full_name: "Dev Creator" },
  created_at: new Date().toISOString(),
} as unknown as User;

const MOCK_SESSION = {
  access_token: "dev-bypass-token",
  refresh_token: "dev-bypass-refresh",
  expires_in: 999999,
  token_type: "bearer",
  user: MOCK_USER,
} as unknown as Session;

const MOCK_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  user_id: "00000000-0000-0000-0000-000000000000",
  full_name: "Dev Creator",
  avatar_initials: "DC",
  email: "dev@homeclarityhub.com",
  phone: null,
};
// ─────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(DEV_BYPASS_AUTH ? MOCK_USER : null);
  const [session, setSession] = useState<Session | null>(DEV_BYPASS_AUTH ? MOCK_SESSION : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_BYPASS_AUTH ? MOCK_PROFILE : null);
  const [roles, setRoles] = useState<AppRole[]>(DEV_BYPASS_AUTH ? ["creator"] : []);
  const [isLoading, setIsLoading] = useState(DEV_BYPASS_AUTH ? false : true);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);
    }
  }, []);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesData) {
      setRoles(rolesData.map((r) => r.role as AppRole));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  }, [user, fetchProfile, fetchRoles]);

  useEffect(() => {
    // Skip real auth entirely when dev bypass is active
    if (DEV_BYPASS_AUTH) return;

    // Safety timeout: if auth doesn't resolve within 8s (e.g. network failure),
    // stop the loading spinner so users aren't stuck indefinitely.
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    // Auth state listener — fires immediately with INITIAL_SESSION for existing sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlocks when querying inside auth listener.
          // setIsLoading(false) MUST be inside here, after roles are fetched —
          // otherwise CreatorRoute evaluates before isCreator is true.
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(newSession.user.id),
              fetchRoles(newSession.user.id),
            ]);
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          setIsLoading(false);
        }
      }
    );

    // Fallback: if no session exists and onAuthStateChange doesn't set loading=false
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!existingSession) {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [fetchProfile, fetchRoles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const isCreator = roles.includes("creator");
  const isTradePartner = roles.includes("trade_partner");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isCreator,
        isTradePartner,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
