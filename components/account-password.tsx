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
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
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
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            visible={visiblePasswords.current}
            onChange={setCurrentPassword}
            onToggle={() =>
              setVisiblePasswords((visible) => ({
                ...visible,
                current: !visible.current,
              }))
            }
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={newPassword}
            visible={visiblePasswords.new}
            onChange={setNewPassword}
            onToggle={() =>
              setVisiblePasswords((visible) => ({
                ...visible,
                new: !visible.new,
              }))
            }
            minLength={8}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            visible={visiblePasswords.confirm}
            onChange={setConfirmPassword}
            onToggle={() =>
              setVisiblePasswords((visible) => ({
                ...visible,
                confirm: !visible.confirm,
              }))
            }
            minLength={8}
          />
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

type PasswordFieldProps = {
  label: string;
  autoComplete: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  minLength?: number;
};

function PasswordField({
  label,
  autoComplete,
  value,
  visible,
  onChange,
  onToggle,
  minLength,
}: PasswordFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <span className="relative">
        <input
          required
          minLength={minLength}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 font-normal outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <PasswordVisibilityIcon visible={visible} />
        </button>
      </span>
    </label>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.1 9.5 7-.4 1.2-1.2 2.5-2.4 3.7M6.2 6.2C4.2 7.5 2.9 9.6 2.5 12c.9 2.9 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
