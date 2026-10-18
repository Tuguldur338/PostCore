"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function AccountPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      try {
        if (!getSupabaseConfig()) {
          throw new Error(
            "Account password changes are unavailable because Supabase is not configured.",
          );
        }
        const { data, error: authError } =
          await createSupabaseBrowserClient().auth.getUser();
        if (authError?.name === "AuthSessionMissingError") return;
        if (authError) throw authError;
        if (isActive) setEmail(data.user?.email ?? "");
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Your account could not be checked.",
          );
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadUser();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Sign in to your account before changing its password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verificationError } =
        await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });
      if (verificationError) {
        if (
          verificationError.message.toLowerCase().includes("invalid login")
        ) {
          throw new Error("Your current password is incorrect.");
        }
        throw verificationError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been changed.");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Your password could not be changed. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
          Security
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Change password
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Verify your current password, then choose a new one for your account.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-600">Checking your account...</p>
      ) : email ? (
        <form className="mt-6 grid max-w-xl gap-4" onSubmit={handleSubmit}>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{email}</span>
          </p>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Current password
            <input
              required
              autoComplete="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            New password
            <input
              required
              minLength={8}
              autoComplete="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Confirm new password
            <input
              required
              minLength={8}
              autoComplete="new-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </label>
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSaving}
            className="smooth-transition inline-flex justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60 sm:justify-self-start"
          >
            {isSaving ? "Updating password..." : "Update password"}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <p>Sign in to your account to change its password.</p>
          <Link
            href="/#account"
            className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
          >
            Sign in
          </Link>
        </div>
      )}
    </section>
  );
}
