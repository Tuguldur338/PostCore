"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { ArrowRight, Eye, EyeOff, Lock, Spinner } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function AccountPassword() {
  const { user } = useAuth();
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user?.email) {
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
    if (!getSupabaseConfig()) {
      setError("Password changes are unavailable because Supabase is not configured.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verificationError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verificationError) {
        if (verificationError.message.toLowerCase().includes("invalid login")) {
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

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Lock size={17} className="text-pine" />
          Sign in to change your password
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Password settings are tied to your PostCore account.
        </p>
        <Link href="/signin?next=/account%3Ftab%3Dsecurity" className="btn btn-primary mt-4">
          Sign in
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine">
          <Lock size={19} />
        </span>
        <div>
          <h2 className="font-display text-2xl tracking-tight text-ink">
            Change password
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Confirm your current password, then choose a new one. You will stay
            signed in on this device.
          </p>
        </div>
      </div>

      <form className="mt-6 grid max-w-lg gap-4" onSubmit={handleSubmit}>
        <p className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[0.8rem] text-muted">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>
        </p>
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          visible={visiblePasswords.current}
          onChange={setCurrentPassword}
          onToggle={() =>
            setVisiblePasswords((visible) => ({ ...visible, current: !visible.current }))
          }
        />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          visible={visiblePasswords.new}
          onChange={setNewPassword}
          onToggle={() =>
            setVisiblePasswords((visible) => ({ ...visible, new: !visible.new }))
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
            setVisiblePasswords((visible) => ({ ...visible, confirm: !visible.confirm }))
          }
          minLength={8}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-rose/25 bg-rose-soft px-3.5 py-2.5 text-[0.8rem] text-rose"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            role="status"
            className="rounded-xl border border-pine/20 bg-pine-soft px-3.5 py-2.5 text-[0.8rem] text-pine"
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="btn btn-primary justify-self-start"
        >
          {isSaving ? <Spinner size={16} /> : null}
          {isSaving ? "Updating password…" : "Update password"}
        </button>
      </form>
    </div>
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
  const inputId = `account-password-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
