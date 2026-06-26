"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Account } from "@/components/account";
import { Catalog } from "@/components/catalog";
import { Intro } from "@/components/intro";
import type { AuthForm, AuthMode, Product, User } from "@/components/types";

type ProductFormState = {
  name: string;
  price: string;
  description: string;
  category: string;
  fitsFor: string;
  image: string;
};

const storageKey = "postcore-users";
const sessionKey = "postcore-current-user";
const productsStorageKey = "postcore-cases";
const defaultProductImage = "/images/cases/clear-shell.svg";
const availableCaseImages = [
  defaultProductImage,
  "/images/cases/arctic-frost.svg",
  "/images/cases/aura-marble.svg",
  "/images/cases/carbon-edge.svg",
  "/images/cases/coastal-wave.svg",
  "/images/cases/crystal-shield.svg",
  "/images/cases/leather-drift.svg",
  "/images/cases/magsafe-shell.svg",
  "/images/cases/matte-smooth.svg",
  "/images/cases/midnight-grip.svg",
  "/images/cases/neon-pop.svg",
  "/images/cases/premium-silk.svg",
  "/images/cases/rugged-shield.svg",
  "/images/cases/sunset-luxe.svg",
  "/images/cases/velvet-bloom.svg",
];

const seedProducts: Product[] = [
  {
    id: "seed-1",
    name: "Arctic Frost",
    price: "$24.99",
    badge: "New",
    description: "A frosted finish that stays slim and feels premium in hand.",
    image: "/images/cases/arctic-frost.svg",
    category: "Slim",
    fitsFor: "iPhone 15 / Galaxy S24",
  },
  {
    id: "seed-2",
    name: "Carbon Edge",
    price: "$29.99",
    badge: "Best seller",
    description:
      "Shock-resistant protection with a sleek matte carbon texture.",
    image: "/images/cases/carbon-edge.svg",
    category: "Protective",
    fitsFor: "iPhone 14 Pro / Pixel 8",
  },
];

const emptyProductForm: ProductFormState = {
  name: "",
  price: "",
  description: "",
  category: "",
  fitsFor: "",
  image: defaultProductImage,
};

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

function readProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function writeProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [status, setStatus] = useState(
    "Create an account or sign in to manage your resale profile.",
  );

  useEffect(() => {
    const savedUsers = readUsers();
    setUsers(savedUsers);

    const savedProducts = readProducts();
    setProducts(savedProducts.length > 0 ? savedProducts : seedProducts);

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

  const handleProductInputChange = (
    field: keyof ProductFormState,
    value: string,
  ) => {
    setProductForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleProductSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.price.trim()) {
      setStatus("Add a case name and price before publishing it.");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productForm.name.trim(),
      price: productForm.price.trim(),
      badge: "New",
      description:
        productForm.description.trim() || "A fresh design ready to ship.",
      image: productForm.image,
      category: productForm.category.trim() || "Phone case",
      fitsFor: productForm.fitsFor.trim() || "Most phones",
    };

    const nextProducts = [newProduct, ...products];
    setProducts(nextProducts);
    writeProducts(nextProducts);
    setProductForm(emptyProductForm);
    setStatus(`${newProduct.name} is now live in your catalog.`);
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
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Add a case
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              Publish a new phone case listing
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleProductSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={productForm.name}
                  onChange={(event) =>
                    handleProductInputChange("name", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
                  placeholder="Case name"
                />
                <input
                  value={productForm.price}
                  onChange={(event) =>
                    handleProductInputChange("price", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
                  placeholder="Price"
                />
              </div>
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  handleProductInputChange("description", event.target.value)
                }
                className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
                placeholder="Describe the case and its style"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={productForm.category}
                  onChange={(event) =>
                    handleProductInputChange("category", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
                  placeholder="Category"
                />
                <input
                  value={productForm.fitsFor}
                  onChange={(event) =>
                    handleProductInputChange("fitsFor", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
                  placeholder="Fits for"
                />
              </div>
              <select
                value={productForm.image}
                onChange={(event) =>
                  handleProductInputChange("image", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0"
              >
                {availableCaseImages.map((image) => (
                  <option key={image} value={image}>
                    {image.split("/").pop()}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add to catalog
              </button>
            </form>
          </div>

          <Catalog products={products} />
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
