"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { DEMO_PROFILE } from "@/lib/constants";
import { getAppMode, getLocalDevFallbackReason, isSupabaseConfigured } from "@/lib/config";
import { AUTH_BOOT_TIMEOUT_MS } from "@/lib/auth-utils";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  error: null,
  isDemoMode: false,
  demoReason: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), AUTH_BOOT_TIMEOUT_MS);
    }),
  ]);
}

function buildProfileFallback(user) {
  return {
    ...DEMO_PROFILE,
    id: user?.id || "demo",
    display_name:
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      DEMO_PROFILE.display_name,
    email: user?.email || DEMO_PROFILE.email,
  };
}

export function AuthProvider({ children }) {
  const explicitDemoMode = getAppMode() === "demo" || !isSupabaseConfigured();
  const demoReason = getLocalDevFallbackReason();
  const [{ supabase, clientInitError }] = useState(() => {
    try {
      return { supabase: createClient(), clientInitError: null };
    } catch (error) {
      return {
        supabase: null,
        clientInitError: error?.message || "Impossible d'initialiser le client Supabase.",
      };
    }
  });
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDemoMode = explicitDemoMode;

  const fetchProfile = async (authUser) => {
    const userId = authUser?.id;

    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error: profileError } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        "Le chargement du profil a pris trop de temps."
      );

      if (profileError) {
        if (profileError.code === "PGRST116") {
          const fallbackProfile = buildProfileFallback(authUser);
          setProfile(fallbackProfile);
          return fallbackProfile;
        }

        const fallbackProfile = buildProfileFallback(authUser);
        setProfile(fallbackProfile);
        setError(profileError.message || "Impossible de charger le profil.");
        return fallbackProfile;
      }

      setProfile(data);
      return data;
    } catch (profileFailure) {
      const fallbackProfile = buildProfileFallback(authUser);
      setProfile(fallbackProfile);
      setError(profileFailure?.message || "Impossible de charger le profil.");
      return fallbackProfile;
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (explicitDemoMode || !supabase || clientInitError) {
        if (!mounted) return;
        setUser(null);
        setProfile(explicitDemoMode ? DEMO_PROFILE : null);
        setError(clientInitError || null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await withTimeout(
          supabase.auth.getUser(),
          "Le chargement de la session a pris trop de temps."
        );

        if (!mounted) return;
        if (userError) throw userError;

        setUser(currentUser ?? null);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
        setError(null);
      } catch (bootError) {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setError(bootError?.message || "Impossible de charger la session.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    if (!supabase || explicitDemoMode || clientInitError) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setLoading(true);
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
        setError(null);
      } catch (sessionError) {
        setError(sessionError?.message || "Impossible de synchroniser la session.");
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [clientInitError, explicitDemoMode, supabase]);

  const refreshProfile = async () => {
    if (isDemoMode) {
      setProfile(DEMO_PROFILE);
      return DEMO_PROFILE;
    }

    if (!user?.id) return null;

    setLoading(true);
    try {
      return await fetchProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase || isDemoMode) {
      setUser(null);
      setProfile(isDemoMode ? DEMO_PROFILE : null);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const { error: signOutError } = await withTimeout(
        supabase.auth.signOut(),
        "La deconnexion a pris trop de temps."
      );

      if (signOutError) throw signOutError;

      setUser(null);
      setProfile(null);
      setError(null);
    } catch (signOutFailure) {
      setError(signOutFailure?.message || "Impossible de se deconnecter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isDemoMode,
        demoReason,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
