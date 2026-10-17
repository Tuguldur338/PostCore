"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

type DeliveryAddress = {
  recipient: string;
  classNumber: string;
  roomNumber: string;
  building: string;
  instructions: string;
};

type Order = {
  id: string;
  order_reference: string;
  product_name: string;
  price: string;
  quantity: number;
  seller_email: string | null;
  delivery_address: DeliveryAddress;
  status: "new" | "completed";
  created_at: string;
};

type OrdersResponse = {
  message?: string;
  orders?: Order[];
  role?: "admin" | "marketplace_admin";
};

type MarketplaceRole = "admin" | "marketplace_admin" | "student";

type MarketplaceAccount = {
  user_id: string;
  email: string;
  display_name: string;
  role: MarketplaceRole;
  created_at: string;
};

function isMarketplaceRole(value: string): value is MarketplaceRole {
  return (
    value === "student" ||
    value === "marketplace_admin" ||
    value === "admin"
  );
}

export function OrdersDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([]);
  const [role, setRole] = useState<"admin" | "marketplace_admin" | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [error, setError] = useState("");
  const supabaseConfigured = Boolean(getSupabaseConfig());

  const loadOrders = async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const result = (await response.json()) as OrdersResponse;
    if (!response.ok) {
      throw new Error(result.message ?? "Orders could not be loaded.");
    }
    if (!result.role) {
      throw new Error("Your marketplace admin role could not be verified.");
    }
    setOrders(result.orders ?? []);
    setRole(result.role);
    if (result.role) {
      const usersResponse = await fetch("/api/admin/users", {
        cache: "no-store",
      });
      const usersResult = (await usersResponse.json()) as {
        message?: string;
        users?: MarketplaceAccount[];
      };
      if (!usersResponse.ok) {
        throw new Error(
          usersResult.message ?? "Marketplace accounts could not be loaded.",
        );
      }
      setAccounts(usersResult.users ?? []);
    } else {
      setAccounts([]);
    }
    setIsSignedIn(true);
  };

  useEffect(() => {
    let isActive = true;

    const restoreAdminSession = async () => {
      try {
        if (!getSupabaseConfig()) return;

        const supabase = createSupabaseBrowserClient();
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError?.name === "AuthSessionMissingError") return;
        if (authError) throw authError;
        if (data.user) {
          await loadOrders();
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not connect to order storage.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void restoreAdminSession();
    return () => {
      isActive = false;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw new Error("Email or password is incorrect.");
      await loadOrders();
      setPassword("");
    } catch (loginError) {
      if (supabase) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error("Failed to clear rejected admin session:", signOutError.message);
        }
      }
      setIsSignedIn(false);
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    const { error: signOutError } =
      await createSupabaseBrowserClient().auth.signOut();
    if (signOutError) {
      setError("Could not sign out. Please try again.");
      return;
    }
    setOrders([]);
    setAccounts([]);
    setRole(null);
    setIsSignedIn(false);
  };

  const updateRole = async (
    account: MarketplaceAccount,
    nextRole: MarketplaceRole,
  ) => {
    setError("");
    setBusyUserId(account.user_id);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: account.user_id, role: nextRole }),
      });
      const result = (await response.json()) as {
        message?: string;
        user?: MarketplaceAccount;
      };
      if (!response.ok || !result.user) {
        throw new Error(
          result.message ?? "The marketplace badge could not be updated.",
        );
      }
      setAccounts((current) =>
        current.map((item) =>
          item.user_id === result.user?.user_id ? result.user : item,
        ),
      );
    } catch (roleError) {
      setError(
        roleError instanceof Error
          ? roleError.message
          : "The marketplace badge could not be updated.",
      );
    } finally {
      setBusyUserId("");
    }
  };

  const updateStatus = async (order: Order) => {
    const nextStatus = order.status === "completed" ? "new" : "completed";
    setError("");
    setBusyOrderId(order.id);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: nextStatus }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Order status could not be updated.");
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Order status could not be updated.",
      );
    } finally {
      setBusyOrderId("");
    }
  };

  const deleteOrder = async (order: Order) => {
    if (!window.confirm(`Delete order ${order.order_reference}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setBusyOrderId(order.id);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Order could not be deleted.");
      }
      setOrders((current) => current.filter((item) => item.id !== order.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Order could not be deleted.",
      );
    } finally {
      setBusyOrderId("");
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
            {role === "admin" ? "ADMIN" : "Marketplace admin"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Purchase requests
          </h1>
          <p className="mt-2 text-slate-600">
            Review new orders, mark them completed, or remove them.
          </p>
        </div>
        {isSignedIn ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-slate-600">Loading orders...</p>
      ) : isSignedIn ? (
        orders.length ? (
          <div className="mt-6 grid gap-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order {order.order_reference}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                      {order.product_name}
                    </h2>
                    <p className="mt-1 font-medium text-orange-700">
                      {formatMntPrice(
                        parseMntAmount(order.price) * order.quantity,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Quantity: {order.quantity} · Unit price:{" "}
                      {formatMntPrice(order.price)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      order.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold">Student: </dt>
                    <dd className="inline">{order.delivery_address.recipient}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Class: </dt>
                    <dd className="inline">{order.delivery_address.classNumber}</dd>
                  </div>
                  {order.delivery_address.roomNumber ? (
                    <div>
                      <dt className="inline font-semibold">Room: </dt>
                      <dd className="inline">{order.delivery_address.roomNumber}</dd>
                    </div>
                  ) : null}
                  {order.delivery_address.building ? (
                    <div>
                      <dt className="inline font-semibold">Floor: </dt>
                      <dd className="inline">{order.delivery_address.building}</dd>
                    </div>
                  ) : null}
                  {order.seller_email ? (
                    <div>
                      <dt className="inline font-semibold">Seller: </dt>
                      <dd className="inline">{order.seller_email}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="inline font-semibold">Received: </dt>
                    <dd className="inline">
                      {new Date(order.created_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                {order.delivery_address.instructions ? (
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
                    <span className="font-semibold">Notes: </span>
                    {order.delivery_address.instructions}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => void updateStatus(order)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {order.status === "completed"
                      ? "Reopen order"
                      : "Mark completed"}
                  </button>
                  <button
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => void deleteOrder(order)}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-slate-50 p-6 text-center text-slate-600">
            There are no purchase requests yet.
          </p>
        )
      ) : !supabaseConfigured ? (
        <div className="mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Order storage is not connected yet.</p>
          <p className="mt-2">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and either{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> or{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code>.env.local</code>, then restart the development server. The
            project URL and public key are available in your Supabase project
            settings.
          </p>
        </div>
      ) : (
        <form className="mt-8 grid max-w-md gap-4" onSubmit={handleLogin}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Email address
            <input
              required
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-400"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-400"
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            Sign in to orders
          </button>
          <p className="text-xs leading-5 text-slate-500">
            Use the marketing admin email and password created in Supabase.
            Use an account assigned the ADMIN or Marketplace Admin badge.
          </p>
        </form>
      )}

      {isSignedIn && role ? (
        <section className="mt-8 border-t border-slate-200 pt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            {role === "admin" ? "ADMIN controls" : "Marketplace Admin controls"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Marketplace account badges
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Assign Student, Marketplace Admin, or ADMIN badges to other
            registered accounts. The primary ADMIN account is protected from
            badge changes.
          </p>
          {accounts.length ? (
            <div className="mt-5 grid gap-3">
              {accounts.map((account) => (
                <div
                  key={account.user_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {account.display_name || "Marketplace user"}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {account.email}
                    </p>
                  </div>
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Badge
                    <select
                      value={account.role}
                      disabled={
                        busyUserId === account.user_id ||
                        account.email.toLowerCase() ===
                          "tuguldur09252@gmail.com"
                      }
                      onChange={(event) => {
                        const nextRole = event.currentTarget.value;
                        if (isMarketplaceRole(nextRole)) {
                          void updateRole(account, nextRole);
                        }
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="student">Student</option>
                      <option value="marketplace_admin">
                        Marketplace Admin
                      </option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No registered marketplace accounts are available to manage yet.
            </p>
          )}
        </section>
      ) : null}
    </section>
  );
}
