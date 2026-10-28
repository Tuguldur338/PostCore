"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import { ArrowRight, Check, Search, ShieldCheck } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

type Order = {
  id: string;
  order_reference: string;
  buyer_email: string | null;
  product_name: string;
  price: string;
  quantity: number;
  seller_email: string | null;
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

const primaryAdminEmail = "tuguldur09252@gmail.com";

const badgeLabels: Record<MarketplaceRole, string> = {
  student: "Student",
  marketplace_admin: "Marketplace Admin",
  admin: "ADMIN",
};

const badgeDescriptions: Record<MarketplaceRole, string> = {
  student: "Can browse, save, and request items.",
  marketplace_admin: "Can manage listings and orders. Cannot change badges.",
  admin: "Full access, including badge assignment for every account.",
};

function badgeToneClass(role: MarketplaceRole): string {
  if (role === "admin") return "bg-amber-100 text-amber-900";
  if (role === "marketplace_admin") return "bg-indigo-100 text-indigo-900";
  return "bg-slate-200 text-slate-700";
}

export function OrdersDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orderCodeSearch, setOrderCodeSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<MarketplaceAccount[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [role, setRole] = useState<"admin" | "marketplace_admin" | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [error, setError] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<MarketplaceAccount | null>(
    null,
  );
  const [pendingRole, setPendingRole] = useState<MarketplaceRole>("student");
  const [roleNotice, setRoleNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const { user: currentUser, signOut } = useAuth();
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const normalizedOrderCodeSearch = orderCodeSearch.trim().toUpperCase();
  const matchingOrders = normalizedOrderCodeSearch
    ? orders.filter((order) =>
        order.order_reference.toUpperCase().includes(normalizedOrderCodeSearch),
      )
    : orders;
  const normalizedRoleQuery = roleQuery.trim().toLowerCase();
  const roleMatches =
    normalizedRoleQuery.length >= 2
      ? accounts
          .filter((account) => account.email.toLowerCase().includes(normalizedRoleQuery))
          .slice(0, 6)
      : [];
  const selectedIsPrimary =
    selectedAccount?.email.toLowerCase() === primaryAdminEmail;
  const selectedIsSelf =
    Boolean(currentUser?.id) && selectedAccount?.user_id === currentUser?.id;
  const selectedIsProtected = Boolean(selectedIsPrimary || selectedIsSelf);

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
    if (result.role === "admin") {
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
          console.error(
            "Failed to clear rejected admin session:",
            signOutError.message,
          );
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
    try {
      await signOut();
    } catch {
      setError("Could not sign out. Please try again.");
      return;
    }
    setOrders([]);
    setAccounts([]);
    setRole(null);
    setIsSignedIn(false);
  };

  const selectAccountForBadge = (account: MarketplaceAccount) => {
    setSelectedAccount(account);
    setPendingRole(account.role);
    setRoleNotice(null);
    setError("");
  };

  const clearBadgeSelection = () => {
    setSelectedAccount(null);
    setPendingRole("student");
    setRoleQuery("");
    setRoleNotice(null);
  };

  const assignBadge = async () => {
    if (!selectedAccount) {
      setRoleNotice({
        tone: "error",
        message: "Search for an account and select it before assigning a badge.",
      });
      return;
    }
    if (role !== "admin") {
      setRoleNotice({
        tone: "error",
        message: "Only the ADMIN account can change marketplace badges.",
      });
      return;
    }
    if (selectedIsProtected) {
      setRoleNotice({
        tone: "error",
        message: selectedIsPrimary
          ? "The primary ADMIN account's badge is protected."
          : "You cannot change your own marketplace badge.",
      });
      return;
    }
    if (pendingRole === selectedAccount.role) {
      setRoleNotice({
        tone: "error",
        message: `${selectedAccount.email} already has the ${badgeLabels[pendingRole]} badge.`,
      });
      return;
    }

    setError("");
    setRoleNotice(null);
    setBusyUserId(selectedAccount.user_id);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedAccount.email,
          role: pendingRole,
        }),
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
      setRoleNotice({
        tone: "success",
        message: `${result.user.display_name || result.user.email} is now ${badgeLabels[result.user.role]}.`,
      });
      setSelectedAccount(null);
      setPendingRole("student");
      setRoleQuery("");
    } catch (roleError) {
      setRoleNotice({
        tone: "error",
        message:
          roleError instanceof Error
            ? roleError.message
            : "The marketplace badge could not be updated.",
      });
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
      setOrderToDelete(null);
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
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-accent-strong">
            {role === "admin" ? "ADMIN" : "Marketplace admin"}
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.025em] text-ink">
            Purchase requests
          </h2>
          <p className="mt-2 text-sm text-muted">
            Review new orders, mark them completed, or remove them.
          </p>
        </div>
        {isSignedIn ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="btn btn-secondary btn-sm"
          >
            Sign out
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rose/25 bg-rose-soft p-3 text-sm text-rose"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted">
          <span className="skeleton h-4 w-4 rounded-full" />
          Loading orders…
        </div>
      ) : isSignedIn ? (
        <>
          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 sm:p-5">
            <label
              htmlFor="order-code-search"
              className="text-sm font-semibold text-slate-800"
            >
              Find an order by its code
            </label>
            <div className="relative mt-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m16 16 4.2 4.2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
              <input
                id="order-code-search"
                type="search"
                autoComplete="off"
                value={orderCodeSearch}
                onChange={(event) => setOrderCodeSearch(event.target.value)}
                placeholder="Enter the 6-character order code"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm font-medium tracking-wide text-slate-900 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Enter all or part of the code shown on the buyer&apos;s receipt.
              Matching orders will appear below, where you can review or delete
              them.
            </p>
            {normalizedOrderCodeSearch ? (
              <p
                className="mt-2 text-xs font-semibold text-slate-700"
                aria-live="polite"
              >
                {matchingOrders.length} matching{" "}
                {matchingOrders.length === 1 ? "order" : "orders"}
              </p>
            ) : null}
          </div>
          {!orders.length ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-slate-600">
              There are no purchase requests yet.
            </p>
          ) : !matchingOrders.length ? (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No orders match that code. Check the code on the receipt and try
              again.
            </p>
          ) : (
            <div className="mt-4 grid gap-4">
              {matchingOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-800">
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
                    {order.buyer_email ? (
                      <div>
                        <dt className="inline font-semibold">Buyer: </dt>
                        <dd className="inline">{order.buyer_email}</dd>
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
                      onClick={() => setOrderToDelete(order)}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
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
            Use the marketing admin email and password created in Supabase. Use
            an account assigned the ADMIN or Marketplace Admin badge.
          </p>
        </form>
      )}

      {isSignedIn && role === "admin" ? (
        <section className="mt-8 border-t border-slate-200 pt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
            ADMIN controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Assign a marketplace badge
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search for the account by its email, select the matching account,
            then choose a badge. Only the ADMIN account can do this. The primary
            ADMIN account is protected.
          </p>

          {roleNotice ? (
            <p
              role={roleNotice.tone === "error" ? "alert" : "status"}
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                roleNotice.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {roleNotice.message}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <label
                htmlFor="badge-email-search"
                className="text-sm font-semibold text-slate-800"
              >
                Find an account by email
              </label>
              <div className="relative mt-2">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="badge-email-search"
                  type="search"
                  autoComplete="off"
                  value={roleQuery}
                  onChange={(event) => {
                    setRoleQuery(event.target.value);
                    setSelectedAccount(null);
                    setRoleNotice(null);
                  }}
                  placeholder="name@orkhonschool.edu.mn"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>
              <p
                className="mt-2 text-xs font-medium text-slate-500"
                aria-live="polite"
              >
                {normalizedRoleQuery.length < 2
                  ? "Type at least 2 characters of the account's email."
                  : `${roleMatches.length} ${
                      roleMatches.length === 1 ? "match" : "matches"
                    } shown`}
              </p>

              {normalizedRoleQuery.length >= 2 ? (
                <div className="mt-3 grid gap-2">
                  {roleMatches.map((account) => {
                    const isSelected = selectedAccount?.user_id === account.user_id;
                    const isProtected =
                      account.email.toLowerCase() === primaryAdminEmail ||
                      account.user_id === currentUser?.id;

                    return (
                      <button
                        key={account.user_id}
                        type="button"
                        onClick={() => selectAccountForBadge(account)}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-orange-400 bg-white ring-2 ring-orange-100"
                            : "border-slate-200 bg-white hover:border-orange-300"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {account.display_name || "Marketplace user"}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {account.email}
                          </span>
                          {isProtected ? (
                            <span className="mt-1 block text-[0.65rem] font-semibold text-amber-700">
                              Protected account
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${badgeToneClass(account.role)}`}
                          >
                            {badgeLabels[account.role]}
                          </span>
                          {isSelected ? (
                            <Check size={15} className="text-orange-600" />
                          ) : (
                            <ArrowRight size={15} className="text-slate-400" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {roleMatches.length === 0 ? (
                    <p className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-500">
                      No registered account email matches that search.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {accounts.length === 0 ? (
                <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-500">
                  No registered marketplace accounts are available yet.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              {selectedAccount ? (
                <>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Selected account
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedAccount.display_name || "Marketplace user"}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {selectedAccount.email}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      New badge
                    </p>
                    <div className="mt-2 grid gap-2">
                      {(["student", "marketplace_admin", "admin"] as const).map(
                        (value) => (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                              pendingRole === value
                                ? "border-orange-400 bg-orange-50/60"
                                : "border-slate-200 hover:border-slate-300"
                            } ${
                              selectedIsProtected ||
                              busyUserId === selectedAccount.user_id
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="badge-role"
                              value={value}
                              checked={pendingRole === value}
                              onChange={() => setPendingRole(value)}
                              disabled={
                                selectedIsProtected ||
                                busyUserId === selectedAccount.user_id
                              }
                              className="mt-1 h-4 w-4 accent-orange-600"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">
                                {badgeLabels[value]}
                              </span>
                              <span className="block text-xs leading-5 text-slate-500">
                                {badgeDescriptions[value]}
                              </span>
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  {selectedIsProtected ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
                      {selectedIsPrimary
                        ? "The primary ADMIN account's badge is protected and cannot be changed."
                        : "You cannot change your own marketplace badge."}
                    </p>
                  ) : pendingRole === "admin" ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
                      ADMIN can manage every account and badge. Only assign this to
                      someone you fully trust.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void assignBadge()}
                    disabled={
                      busyUserId === selectedAccount.user_id ||
                      selectedIsProtected ||
                      pendingRole === selectedAccount.role
                    }
                    className="mt-4 w-full rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {busyUserId === selectedAccount.user_id
                      ? "Assigning badge…"
                      : `Assign ${badgeLabels[pendingRole]}`}
                  </button>
                  <button
                    type="button"
                    onClick={clearBadgeSelection}
                    className="mt-2 w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Choose another account
                  </button>
                </>
              ) : (
                <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <ShieldCheck size={22} />
                  </span>
                  <p className="mt-3 font-semibold text-slate-900">
                    Select an account first
                  </p>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                    Search for the exact email, then pick it from the results.
                    Badge controls appear only after you select a match.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {orderToDelete ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              busyOrderId !== orderToDelete.id
            ) {
              setOrderToDelete(null);
            }
          }}
        >
          <section
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_30px_100px_-25px_rgba(15,23,42,0.75)]"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
            aria-describedby="delete-order-description"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-700 via-rose-600 to-orange-500 px-6 pb-7 pt-6 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[24px] border-white/10"
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-7 w-7"
                  >
                    <path
                      d="M12 8v5m0 3h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3.75c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <span className="rounded-full border border-white/25 bg-black/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                  Permanent action
                </span>
              </div>
              <h2
                id="delete-order-title"
                className="relative mt-5 text-2xl font-bold tracking-tight"
              >
                Delete this order?
              </h2>
              <p
                id="delete-order-description"
                className="relative mt-2 text-sm leading-6 text-white/90"
              >
                This purchase request will be permanently removed and cannot be
                restored.
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Order {orderToDelete.order_reference}
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {orderToDelete.product_name}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {formatMntPrice(
                    parseMntAmount(orderToDelete.price) *
                      orderToDelete.quantity,
                  )}{" "}
                  · Quantity: {orderToDelete.quantity}
                </p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busyOrderId === orderToDelete.id}
                  onClick={() => setOrderToDelete(null)}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Keep order
                </button>
                <button
                  type="button"
                  disabled={busyOrderId === orderToDelete.id}
                  onClick={() => void deleteOrder(orderToDelete)}
                  className="rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition-all hover:-translate-y-0.5 hover:from-rose-800 hover:to-rose-700 hover:shadow-xl disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {busyOrderId === orderToDelete.id
                    ? "Deleting order..."
                    : "Yes, delete order"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
