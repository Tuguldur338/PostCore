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

const emptyDeliveryAddress: DeliveryAddress = {
  recipient: "",
  classNumber: "",
  roomNumber: "",
  building: "",
  instructions: "",
};

function createMarketplaceProfile(
  authUser: SupabaseAuthUser,
  cachedUsers: User[],
): User {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Your Supabase account does not have an email address.");
  }

  const cachedUser = cachedUsers.find(
    (user) => user.email.toLowerCase() === email,
  );
  const metadataName = authUser.user_metadata.full_name;
  const name =
    (typeof metadataName === "string" && metadataName.trim()) ||
    cachedUser?.name ||
    email.split("@")[0];

  return {
    id: authUser.id,
    name,
    email,
    role:
      authUser.app_metadata.role === "marketing_admin"
        ? "admin"
        : cachedUser?.role ?? "student",
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

        const user = createMarketplaceProfile(data.user, cachedUsers);
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
          setForm({ name: "", email: "", password: "", confirmPassword: "" });
          setStatus(
            "Check your email to confirm registration, then sign in here. If you already have a Supabase account, switch to Sign in instead. Shared accounts work on Vercel and localhost.",
          );
          return;
        }

        const user = createMarketplaceProfile(data.user, users);
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

      const user = createMarketplaceProfile(data.user, users);
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
        authError instanceof Error
          ? authError.message
          : "Sign-in failed. Please try again.",
      );
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
            onModeChange={setMode}
            onSubmit={handleSubmit}
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
