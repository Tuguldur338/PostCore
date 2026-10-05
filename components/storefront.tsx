"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Account } from "@/components/account";
import {
  establishUserSession,
  readUsers,
  restoreUserSession,
  writeUsers,
} from "@/components/auth-store";
import { Catalog } from "@/components/catalog";
import { Intro } from "@/components/intro";
import { readProducts, seedProducts } from "@/components/product-store";
import type {
  AuthForm,
  AuthMode,
  DeliveryAddress,
  Product,
  User,
} from "@/components/types";

const sessionKey = "postcore-current-user";

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
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [hasSellerProducts, setHasSellerProducts] = useState(true);
  const [status, setStatus] = useState(
    "Create an account or sign in to manage your student marketplace profile.",
  );

  useEffect(() => {
    queueMicrotask(() => {
      const session = restoreUserSession();
      setUsers(session?.users ?? readUsers());

      const savedProducts = readProducts();
      setProducts(savedProducts);
      setHasSellerProducts(savedProducts.length > 0);

      if (!session) return;
      setCurrentUser(session.user);
      setDeliveryAddress({
        ...emptyDeliveryAddress,
        ...session.user.deliveryAddress,
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser) {
      window.localStorage.setItem(sessionKey, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

      const alreadyExists = users.some(
        (user) => user.email.toLowerCase() === email,
      );
      if (alreadyExists) {
        setStatus("That email is already registered.");
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email,
        password: form.password,
      };

      const nextUsers = [...users, newUser];
      const session = establishUserSession(newUser, nextUsers);
      setUsers(session.users);
      setCurrentUser(session.user);
      setDeliveryAddress(emptyDeliveryAddress);
      setDeliveryStatus("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setStatus(`Welcome aboard, ${newUser.name}! Your profile is ready.`);
      return;
    }

    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() === email && user.password === form.password,
    );

    if (foundUser) {
      const session = establishUserSession(foundUser, users);
      setUsers(session.users);
      setCurrentUser(session.user);
      setDeliveryAddress({
        ...emptyDeliveryAddress,
        ...session.user.deliveryAddress,
      });
      setDeliveryStatus("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setStatus(`Welcome back, ${foundUser.name}!`);
    } else {
      setStatus("Incorrect email or password. Try registering first.");
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

  const handleLogout = () => {
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

    const updatedUser = { ...currentUser, deliveryAddress };
    const nextUsers = users.map((user) =>
      user.id === currentUser.id ? updatedUser : user,
    );
    setUsers(nextUsers);
    writeUsers(nextUsers);
    setCurrentUser(updatedUser);
    setDeliveryStatus("Class and room saved to your account.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Intro />

      <section
        id="items"
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <Catalog products={products} showProductCards={hasSellerProducts} />

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
