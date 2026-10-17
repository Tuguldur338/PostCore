"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Account } from "@/components/account";
import {
  readUsers,
  writeUsers,
} from "@/components/auth-store";
import { getDeliveryAddressError } from "@/components/delivery-validation";
import { Catalog } from "@/components/catalog";
import { Intro } from "@/components/intro";
import { fetchSharedProducts } from "@/components/product-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type {
  AuthForm,
  AuthMode,
  DeliveryAddress,
  Product,
  User,
} from "@/components/types";

const sessionKey = "postcore-current-user";
const authSetupMessage =
  "Shared sign-in is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel Project Settings, then redeploy.";

function isAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const status = "status" in error ? error.status : undefined;
  const message = "message" in error ? error.message : undefined;
  const code =
    "code" in error ? String(error.code).toLowerCase() : "";
  return (
    status === 429 ||
    code.includes("rate_limit") ||
    (typeof message === "string" &&
      /rate.?limit|too many requests/i.test(message))
  );
}

function getAuthErrorMessage(error: unknown, operation: "register" | "sign-in") {
  if (isAuthRateLimitError(error)) return authRateLimitMessage;

  const message =
    error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code).toLowerCase()
      : "";

  if (
    code.includes("user_already_exists") ||
    code.includes("email_exists") ||
    normalizedMessage.includes("already registered")
  ) {
    return "This email already has an account. Switch to Sign in instead.";
  }

  if (normalizedMessage.includes("database error saving new user")) {
    return "Supabase rejected account creation while saving its marketplace profile. Run the latest supabase/schema.sql in this app's Supabase project, then try again.";
  }

  if (
    normalizedMessage.includes("email address not authorized") ||
    normalizedMessage.includes("email not authorized")
  ) {
    return "Supabase's built-in email service only sends to addresses belonging to your Supabase organization. To let students register with other addresses, configure custom SMTP in Supabase Dashboard > Authentication > SMTP Settings.";
  }

  if (
    normalizedMessage.includes("password") &&
    (normalizedMessage.includes("weak") ||
      normalizedMessage.includes("short") ||
      normalizedMessage.includes("at least"))
  ) {
    return `Supabase rejected the password: ${message}`;
  }

  if (
    normalizedMessage.includes("signup is disabled") ||
    normalizedMessage.includes("signups not allowed")
  ) {
    return "New registrations are disabled in this Supabase project. Enable public sign-ups in Supabase Authentication settings.";
  }

  return message || (operation === "register"
    ? "Registration failed. Please try again."
    : "Sign-in failed. Please try again.");
}

const authRateLimitMessage =
  "Supabase's built-in email service has a project-wide limit of 2 emails per hour and only sends to addresses belonging to your Supabase organization. Waiting 60 seconds may not be enough. Configure custom SMTP in Supabase Dashboard > Authentication > SMTP Settings to send confirmations to student addresses; after SMTP is enabled, adjust Authentication > Rate Limits if needed.";

type MarketplaceProfileResponse = {
  message?: string;
  profile?: {
    user_id: string;
    email: string;
    display_name: string;
    role: User["role"];
  };
};

const emptyDeliveryAddress: DeliveryAddress = {
  recipient: "",
  classNumber: "",
  roomNumber: "",
  building: "",
  instructions: "",
};

async function createMarketplaceProfile(
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
    ...(cachedUser?.deliveryAddress
      ? { deliveryAddress: cachedUser.deliveryAddress }
      : {}),
  };
}

function saveMarketplaceProfile(user: User, cachedUsers: User[]) {
  const nextUsers = [
    ...cachedUsers.filter(
      (savedUser) => savedUser.email.toLowerCase() !== user.email.toLowerCase(),
    ),
    user,
  ];
  writeUsers(nextUsers);
  return nextUsers;
}

export function Storefront() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [form, setForm] = useState<AuthForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress>(emptyDeliveryAddress);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [hasSellerProducts, setHasSellerProducts] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [status, setStatus] = useState(
    "Create an account or sign in to manage your student marketplace profile.",
  );

  useEffect(() => {
    let isActive = true;
    const restoreSession = async () => {
      const cachedUsers = readUsers();
      if (isActive) setUsers(cachedUsers);
      window.localStorage.removeItem(sessionKey);

      if (!getSupabaseConfig()) {
        if (isActive) setStatus(authSetupMessage);
        return;
      }

      try {
        const { data, error } =
          await createSupabaseBrowserClient().auth.getUser();
        if (error?.name === "AuthSessionMissingError") return;
        if (error) throw error;
        if (!data.user || !isActive) return;

        const user = await createMarketplaceProfile(data.user, cachedUsers);
        const nextUsers = saveMarketplaceProfile(user, cachedUsers);
        setUsers(nextUsers);
        setCurrentUser(user);
        setDeliveryAddress({
          ...emptyDeliveryAddress,
          ...user.deliveryAddress,
        });
        window.localStorage.setItem(sessionKey, JSON.stringify(user));
        setStatus(`Welcome back, ${user.name}!`);
      } catch (restoreError) {
        if (isActive) {
          setStatus(
            restoreError instanceof Error
              ? restoreError.message
              : "Your shared account could not be loaded.",
          );
        }
      }
    };

    void restoreSession();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    void fetchSharedProducts()
      .then((sharedProducts) => {
        if (!isActive) return;
        setProducts(sharedProducts);
        setHasSellerProducts(sharedProducts.length > 0);
        setCatalogError("");
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setCatalogError(
            loadError instanceof Error
              ? loadError.message
              : "The product catalog could not be loaded.",
          );
        }
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser) {
      window.localStorage.setItem(sessionKey, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    setNeedsEmailConfirmation(false);

    if (mode === "register") {
      if (
        !form.name.trim() ||
        !email ||
        !form.password ||
        form.password !== form.confirmPassword
      ) {
        setStatus("Please fill out the form and make sure passwords match.");
        return;
      }
    }

    if (!getSupabaseConfig()) {
      setStatus(authSetupMessage);
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: { full_name: form.name.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        if (!data.user) {
          throw new Error("Account creation did not return a user. Please try again.");
        }
        if (!data.session) {
          setNeedsEmailConfirmation(true);
          setForm((previous) => ({
            ...previous,
            email,
            password: "",
            confirmPassword: "",
          }));
          setStatus(
            data.user.identities?.length === 0
              ? "An account with this email may already exist. If you just registered, resend its confirmation email; otherwise switch to Sign in."
              : "Registration started. Check your inbox and spam folder for the confirmation email, then sign in. If it does not arrive, you can resend it below.",
          );
          return;
        }

        const user = await createMarketplaceProfile(data.user, users);
        const nextUsers = saveMarketplaceProfile(user, users);
        setUsers(nextUsers);
        setCurrentUser(user);
        setDeliveryAddress(emptyDeliveryAddress);
        setDeliveryStatus("");
        setForm({ name: "", email: "", password: "", confirmPassword: "" });
        setStatus(`Welcome aboard, ${user.name}! Your profile is ready.`);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) {
        throw new Error(
          "Email or password is incorrect. If this account was created only on localhost, register it once with the same email on Supabase first. Check that the email ends in gmail.com if that is the address you intended.",
        );
      }
      if (!data.user) {
        throw new Error("Sign-in did not return an account. Please try again.");
      }

      const user = await createMarketplaceProfile(data.user, users);
      const nextUsers = saveMarketplaceProfile(user, users);
      setUsers(nextUsers);
      setCurrentUser(user);
      setDeliveryAddress({
        ...emptyDeliveryAddress,
        ...user.deliveryAddress,
      });
      setDeliveryStatus("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setStatus(`Welcome back, ${user.name}!`);
    } catch (authError) {
      setStatus(
        getAuthErrorMessage(
          authError,
          mode === "register" ? "register" : "sign-in",
        ),
      );
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const resendConfirmation = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !getSupabaseConfig()) {
      setStatus("Enter your registration email and try again.");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setStatus(
        "If this address has a pending registration, a confirmation email has been sent. Check your inbox and spam folder.",
      );
    } catch (resendError) {
      setStatus(getAuthErrorMessage(resendError, "register"));
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleInputChange = (field: keyof AuthForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      const updatedUser = { ...currentUser, image: imageData };
      const nextUsers = saveMarketplaceProfile(
        updatedUser,
        users,
      );

      setUsers(nextUsers);
      setCurrentUser(updatedUser);
      setStatus("Profile picture updated successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
    } catch (logoutError) {
      setStatus(
        logoutError instanceof Error
          ? logoutError.message
          : "Could not sign out. Please try again.",
      );
      return;
    }

    setCurrentUser(null);
    setDeliveryAddress(emptyDeliveryAddress);
    setDeliveryStatus("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(sessionKey);
    }
    setStatus("You are signed out. Sign in anytime to continue selling.");
  };

  const handleDeliveryAddressChange = (
    field: keyof DeliveryAddress,
    value: string,
  ) => {
    setDeliveryAddress((previous) => ({ ...previous, [field]: value }));
  };

  const handleDeliveryAddressSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const validationError = getDeliveryAddressError(deliveryAddress);
    if (validationError) {
      setDeliveryStatus(validationError);
      return;
    }

    const updatedUser = { ...currentUser, deliveryAddress };
    const nextUsers = saveMarketplaceProfile(updatedUser, users);
    setUsers(nextUsers);
    setCurrentUser(updatedUser);
    setDeliveryStatus("Delivery destination saved to your account.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Intro />

      <section
        id="items"
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0">
          {catalogError ? (
            <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {catalogError}
            </p>
          ) : null}
          <Catalog
            products={products}
            showProductCards={hasSellerProducts}
            onPurchaseSuccess={() => {
              void fetchSharedProducts()
                .then((sharedProducts) => {
                  setProducts(sharedProducts);
                  setHasSellerProducts(sharedProducts.length > 0);
                })
                .catch((loadError: unknown) => {
                  setCatalogError(
                    loadError instanceof Error
                      ? loadError.message
                      : "The product catalog could not be refreshed.",
                  );
                });
            }}
          />
        </div>

        <div
          id="account"
          className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <Account
            currentUser={currentUser}
            mode={mode}
            form={form}
            status={status}
            isSubmitting={isSubmittingAuth}
            canResendConfirmation={needsEmailConfirmation}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            onResendConfirmation={() => void resendConfirmation()}
            onInputChange={handleInputChange}
            onImageChange={handleImageChange}
            onLogout={handleLogout}
            deliveryAddress={deliveryAddress}
            deliveryStatus={deliveryStatus}
            onDeliveryAddressChange={handleDeliveryAddressChange}
            onDeliveryAddressSubmit={handleDeliveryAddressSubmit}
          />
        </div>
      </section>
    </div>
  );
}
