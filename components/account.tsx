import { useState, type ChangeEvent, type FormEvent } from "react";
import type { AuthForm, AuthMode, User } from "./types";

type AuthPanelProps = {
  currentUser: User | null;
  mode: AuthMode;
  form: AuthForm;
  status: string;
  isSubmitting: boolean;
  canResendConfirmation: boolean;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResendConfirmation: () => void;
  onInputChange: (field: keyof AuthForm, value: string) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Account({
  currentUser,
  mode,
  form,
  status,
  isSubmitting,
  canResendConfirmation,
  onModeChange,
  onSubmit,
  onResendConfirmation,
  onInputChange,
  onImageChange,
  onLogout,
}: AuthPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (currentUser) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-sky-400 bg-slate-200 text-xl font-semibold text-slate-700">
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(currentUser.name)
              )}
            </div>
            <div>
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                  currentUser.role === "admin"
                    ? "border-amber-700 bg-amber-700 text-white"
                    : currentUser.role === "marketplace_admin"
                      ? "border-indigo-700 bg-indigo-700 text-white"
                      : "border-slate-300 bg-slate-200 text-slate-800"
                }`}
              >
                {currentUser.role === "admin"
                  ? "ADMIN"
                  : currentUser.role === "marketplace_admin"
                    ? "Marketplace Admin"
                    : "Student"}
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {currentUser.name}
              </h2>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 transition-colors duration-200 ease-out hover:border-sky-400 hover:bg-sky-50">
          <span className="font-semibold text-slate-900">
            Change profile picture
          </span>
          <span className="mt-1">
            Pick an image from your computer folder or your phone gallery.
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onImageChange}
          />
        </label>

        <button
          type="button"
          onClick={onLogout}
          className="smooth-transition w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition-colors duration-200 ease-out hover:bg-slate-700"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 rounded-3xl bg-slate-950 p-4 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
          Seller access
        </p>
        <h3 className="mt-2 text-xl font-semibold">Join the marketplace</h3>
        <p className="mt-1 text-sm text-slate-300">
          Create an account to manage listings and update your profile photo.
        </p>
      </div>

      <div className="flex gap-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className={`smooth-transition flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-out ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => onModeChange("register")}
          className={`smooth-transition flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-out ${mode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          Register
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition-colors duration-200 ease-out focus:border-sky-400"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={(event) => onInputChange("name", event.target.value)}
              placeholder="Ari Johnson"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition-colors duration-200 ease-out focus:border-sky-400"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => onInputChange("email", event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 pr-12 outline-none ring-0 transition-colors duration-200 ease-out focus:border-sky-400"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
              value={form.password}
              onChange={(event) =>
                onInputChange("password", event.target.value)
              }
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <PasswordVisibilityIcon visible={showPassword} />
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <div className="relative">
              <input
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 pr-12 outline-none ring-0 transition-colors duration-200 ease-out focus:border-sky-400"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(event) =>
                  onInputChange("confirmPassword", event.target.value)
                }
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmPassword}
                className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                <PasswordVisibilityIcon visible={showConfirmPassword} />
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="smooth-transition w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition-colors duration-200 ease-out hover:bg-sky-700"
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "register"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {mode === "register" && canResendConfirmation ? (
        <button
          type="button"
          disabled={isSubmitting || !form.email.trim()}
          onClick={onResendConfirmation}
          className="mt-3 w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Resend confirmation email
        </button>
      ) : null}

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {status}
      </div>
    </div>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.1 9.5 7-.4 1.2-1.2 2.5-2.4 3.7M6.2 6.2C4.2 7.5 2.9 9.6 2.5 12c.9 2.9 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
