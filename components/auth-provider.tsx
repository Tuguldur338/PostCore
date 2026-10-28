"use client";

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readUsers, writeUsers } from "@/components/auth-store";
import type { User } from "@/components/types";
import {
  authSetupMessage,
  confirmationRedirectSetupMessage,
  getAuthErrorMessage,
  getConfirmationRedirectUrl,
} from "@/lib/auth-errors";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

type MarketplaceProfileResponse = {
  message?: string;
  profile?: {
    user_id: string;
    email: string;
    display_name: string;
    role: User["role"];
  };
};

type RegisterResult = {
  needsConfirmation: boolean;
  message?: string;
};

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  isConfigured: boolean;
  sessionError: string;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<RegisterResult>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (imageDataUrl: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadMarketplaceProfile(
  authUser: SupabaseAuthUser,
  cachedUsers: User[],
): Promise<User> {
  const response = await fetch("/api/profile", { cache: "no-store" });
  const result = (await response.json()) as MarketplaceProfileResponse;
  if (!response.ok || !result.profile) {
    throw new Error(
      result.message ?? "Your marketplace profile could not be loaded.",
    );
  }

  const email = result.profile.email.trim().toLowerCase();
  const cachedUser = cachedUsers.find(
    (user) => user.email.toLowerCase() === email,
  );
  const metadataName = authUser.user_metadata.full_name;
  const name =
    result.profile.display_name.trim() ||
    (typeof metadataName === "string" && metadataName.trim()) ||
    cachedUser?.name ||
    email.split("@")[0];

  return {
    id: result.profile.user_id,
    name,
    email,
    role: result.profile.role,
    ...(cachedUser?.image ? { image: cachedUser.image } : {}),
  };
}

function cacheProfile(user: User) {
  const cachedUsers = readUsers();
  writeUsers([
    ...cachedUsers.filter(
      (savedUser) => savedUser.email.toLowerCase() !== user.email.toLowerCase(),
    ),
    user,
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const isConfigured = Boolean(getSupabaseConfig());

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      if (!isConfigured) {
        if (isActive) setIsReady(true);
        return;
      }

      const cachedUsers = readUsers();
      try {
        const { data, error } =
          await createSupabaseBrowserClient().auth.getUser();
        if (error?.name === "AuthSessionMissingError") return;
        if (error) throw error;
        if (!data.user) return;

        const profile = await loadMarketplaceProfile(data.user, cachedUsers);
        if (!isActive) return;
        cacheProfile(profile);
        setUser(profile);
      } catch (restoreError) {
        if (isActive) {
          setSessionError(
            restoreError instanceof Error
              ? restoreError.message
              : "Your saved session could not be restored.",
          );
        }
      } finally {
        if (isActive) setIsReady(true);
      }
    };

    void restoreSession();
    return () => {
      isActive = false;
    };
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!getSupabaseConfig()) throw new Error(authSetupMessage);

    const { data, error } =
      await createSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
    if (error) throw new Error(getAuthErrorMessage(error, "sign-in"));
    if (!data.user) throw new Error("Sign-in did not return an account.");

    const profile = await loadMarketplaceProfile(data.user, readUsers());
    cacheProfile(profile);
    setUser(profile);
  }, []);

  const register = useCallback(
    async ({ name, email, password }: { name: string; email: string; password: string }) => {
      if (!getSupabaseConfig()) throw new Error(authSetupMessage);

      let emailRedirectTo: string | null = null;
      try {
        emailRedirectTo = getConfirmationRedirectUrl();
      } catch (redirectError) {
        throw new Error(
          redirectError instanceof Error
            ? redirectError.message
            : confirmationRedirectSetupMessage,
        );
      }
      if (!emailRedirectTo) throw new Error(confirmationRedirectSetupMessage);

      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await createSupabaseBrowserClient().auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo,
        },
      });
      if (error) throw new Error(getAuthErrorMessage(error, "register"));
      if (!data.user) {
        throw new Error("Account creation did not return a user. Please try again.");
      }

      if (!data.session) {
        return {
          needsConfirmation: true,
          message:
            data.user.identities?.length === 0
              ? "An account with this email may already exist. If you just registered, resend its confirmation email; otherwise switch to Sign in."
              : "Registration started. Check your inbox and spam folder for the confirmation link, then sign in. If it does not arrive, you can resend it below.",
        };
      }

      const profile = await loadMarketplaceProfile(data.user, readUsers());
      cacheProfile(profile);
      setUser(profile);
      return { needsConfirmation: false };
    },
    [],
  );

  const resendConfirmation = useCallback(async (email: string) => {
    if (!getSupabaseConfig()) throw new Error(authSetupMessage);

    let emailRedirectTo: string | null = null;
    try {
      emailRedirectTo = getConfirmationRedirectUrl();
    } catch {
      throw new Error(confirmationRedirectSetupMessage);
    }
    if (!emailRedirectTo) throw new Error(confirmationRedirectSetupMessage);

    const { error } = await createSupabaseBrowserClient().auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo },
    });
    if (error) throw new Error(getAuthErrorMessage(error, "register"));
  }, []);

  const signOut = useCallback(async () => {
    if (getSupabaseConfig()) {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) {
        throw new Error(error.message || "Could not sign out. Please try again.");
      }
    }
    setUser(null);
  }, []);

  const updateAvatar = useCallback((imageDataUrl: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const nextUser = { ...currentUser, image: imageDataUrl };
      cacheProfile(nextUser);
      return nextUser;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isConfigured,
      sessionError,
      signIn,
      register,
      resendConfirmation,
      signOut,
      updateAvatar,
    }),
    [
      user,
      isReady,
      isConfigured,
      sessionError,
      signIn,
      register,
      resendConfirmation,
      signOut,
      updateAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
