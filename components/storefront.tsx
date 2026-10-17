"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Account } from "@/components/account";
import { readUsers, writeUsers } from "@/components/auth-store";
import { getDeliveryAddressError } from "@/components/delivery-validation";
import { Catalog } from "@/components/catalog";
import { Intro } from "@/components/intro";
import { fetchSharedProducts } from "@/components/product-store";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  AuthForm,
  AuthMode,
  DeliveryAddress,
  Product,
  User,
} from "@/components/types";

type MarketplaceProfile = {
  user_id: string;
  email: string;
  display_name: string;
  role: User["role"];
};

type MarketplaceProfileResponse = {
  message?: string;
  profile?: MarketplaceProfile;
};

async function loadMarketplaceProfile(authUser: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}) {
  const response = await fetch("/api/profile", { cache: "no-store" });
  const result = (await response.json()) as MarketplaceProfileResponse;
  if (!response.ok || !result.profile) {
    throw new Error(result.message ?? "Your marketplace profile could not be loaded.");
  }

  const cachedUsers = readUsers();
  const cachedUser = cachedUsers.find(
    (user) => user.email.toLowerCase() === result.profile?.email.toLowerCase(),
  );
  const metadataName = authUser.user_metadata.full_name;
  const name =
    result.profile.display_name.trim() ||
    (typeof metadataName === "string" ? metadataName.trim() : "") ||
    cachedUser?.name ||
    result.profile.email.split("@")[0];
  const user: User = {
    id: result.profile.user_id,
    name,
    email: result.profile.email,
    role: result.profile.role,
    ...(cachedUser?.image ? { image: cachedUser.image } : {}),
    ...(cachedUser?.deliveryAddress
      ? { deliveryAddress: cachedUser.deliveryAddress }
      : {}),
  };
  const users = [
    ...cachedUsers.filter(
      (savedUser) => savedUser.email.toLowerCase() !== user.email.toLowerCase(),
    ),
    user,
  ];
  writeUsers(users);
  return { user, users };
}

const emptyDeliveryAddress: DeliveryAddress = {
  recipient: "",
  classNumber: "",
  roomNumber: "",
  building: "",
  instructions: "",
};

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
    const restoreSupabaseSession = async () => {
      try {
        const cachedUsers = readUsers();
        if (isActive) setUsers(cachedUsers);
        window.localStorage.removeItem("postcore-current-user");
        window.localStorage.removeItem("postcore-admin-id");

        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        if (error?.name === "AuthSessionMissingError") return;
        if (error) throw error;
        if (!data.user) return;

        const session = await loadMarketplaceProfile(data.user);
        if (!isActive) return;
        setUsers(session.users);
        setCurrentUser(session.user);
        setDeliveryAddress({
          ...emptyDeliveryAddress,
          ...session.user.deliveryAddress,
        });
        setStatus(`Welcome back, ${session.user.name}!`);
      } catch (loadError) {
        if (isActive) {
          setStatus(
            loadError instanceof Error
              ? loadError.message
              : "Your marketplace account could not be loaded.",
          );
        }
      }
    };

    void restoreSupabaseSession();
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

    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: { data: { full_name: form.name.trim() } },
        });
        if (error) throw error;
        if (!data.user || !data.session) {
          setStatus(
            "Check your email to confirm your account, then sign in. Your admin badge is applied after confirmation.",
          );
          return;
        }

        const session = await loadMarketplaceProfile(data.user);
        setUsers(session.users);
        setCurrentUser(session.user);
        setDeliveryAddress({
          ...emptyDeliveryAddress,
          ...session.user.deliveryAddress,
        });
        setDeliveryStatus("");
        setForm({ name: "", email: "", password: "", confirmPassword: "" });
        setStatus(`Welcome aboard, ${session.user.name}! Your profile is ready.`);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) throw new Error("Incorrect email or password.");
      if (!data.user) throw new Error("Sign-in did not return an account.");

      const session = await loadMarketplaceProfile(data.user);
      setUsers(session.users);
      setCurrentUser(session.user);
      setDeliveryAddress({
        ...emptyDeliveryAddress,
        ...session.user.deliveryAddress,
      });
      setDeliveryStatus("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setStatus(`Welcome back, ${session.user.name}!`);
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
      const nextUsers = users.map((user) =>
        user.id === currentUser.id ? updatedUser : user,
      );

      setUsers(nextUsers);
      writeUsers(nextUsers);
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
    const nextUsers = users.map((user) =>
      user.id === currentUser.id ? updatedUser : user,
    );
    setUsers(nextUsers);
    writeUsers(nextUsers);
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
