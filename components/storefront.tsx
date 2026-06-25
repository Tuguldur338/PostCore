"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Account } from "@/components/account";
import { Catalog } from "@/components/catalog";
import { Intro } from "@/components/intro";
import type { AuthForm, AuthMode, Product, User } from "@/components/types";

const featuredProducts: Product[] = [
  {
    name: "Developer Seller",
    price: "Verified",
    badge: "Developer",
    description:
      "Builds and lists fresh case collections with fast updates and strong product knowledge.",
    image: "",
    category: "Tech",
    fitsFor: "Phone case listings",
  },
  {
    name: "Trusted Reseller",
    price: "Verified",
    badge: "Seller",
    description:
      "Reliable reseller with polished listings, timely replies, and a consistent customer experience.",
    image: "",
    category: "Resale",
    fitsFor: "Marketplace profile",
  },
  {
    name: "Case Curator",
    price: "Verified",
    badge: "Curator",
    description:
      "Hand-picks standout designs and keeps each listing clearly organized for shoppers.",
    image: "",
    category: "Style",
    fitsFor: "Collection curation",
  },
  {
    name: "Quick Ship Seller",
    price: "Verified",
    badge: "Seller",
    description:
      "Known for fast dispatch, smooth communication, and dependable order handling.",
    image: "",
    category: "Service",
    fitsFor: "Fast delivery",
  },
];

const storageKey = "postcore-users";
const sessionKey = "postcore-current-user";

function readUsers(): User[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(users));
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
  const [status, setStatus] = useState(
    "Create an account or sign in to manage your resale profile.",
  );

  useEffect(() => {
    const savedUsers = readUsers();
    setUsers(savedUsers);

    if (typeof window !== "undefined") {
      const savedSession = window.localStorage.getItem(sessionKey);
      if (savedSession) {
        try {
          setCurrentUser(JSON.parse(savedSession) as User);
        } catch {
          window.localStorage.removeItem(sessionKey);
        }
      }
    }
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
      writeUsers(nextUsers);
      setUsers(nextUsers);
      setCurrentUser(newUser);
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setStatus(`Welcome aboard, ${newUser.name}! Your profile is ready.`);
      return;
    }

    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() === email && user.password === form.password,
    );

    if (foundUser) {
      setCurrentUser(foundUser);
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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(sessionKey);
    }
    setStatus("You are signed out. Sign in anytime to continue selling.");
  };

  return (
    <div className="flex flex-col gap-6">
      <Intro />

      <section
        id="cases"
        className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]"
      >
        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Explore
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="rounded-xl bg-slate-50 px-3 py-2">Latest cases</p>
              <p className="rounded-xl px-3 py-2">Popular sellers</p>
              <p className="rounded-xl px-3 py-2">Saved favorites</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Today
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              New arrivals every week
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fresh styles, protective finishes, and easy seller tools.
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Why sellers love it
            </p>
            <p className="mt-2 text-lg text-slate-700">
              Upload a profile picture instantly, keep your listings organized,
              and chat with buyers from desktop or mobile.
            </p>
          </div>
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
          />
        </div>
      </section>
    </div>
  );
}
