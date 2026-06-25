import type { ChangeEvent, FormEvent } from "react";
import type { AuthForm, AuthMode, User } from "./types";

type AuthPanelProps = {
  currentUser: User | null;
  mode: AuthMode;
  form: AuthForm;
  status: string;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
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
  onModeChange,
  onSubmit,
  onInputChange,
  onImageChange,
  onLogout,
}: AuthPanelProps) {
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                Your profile
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                {currentUser.name}
              </h2>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 transition hover:border-sky-400 hover:bg-sky-50">
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
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
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
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => onModeChange("register")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-slate-900 text-white" : "text-slate-600"}`}
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
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition focus:border-sky-400"
              type="text"
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
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition focus:border-sky-400"
            type="email"
            value={form.email}
            onChange={(event) => onInputChange("email", event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition focus:border-sky-400"
            type="password"
            value={form.password}
            onChange={(event) => onInputChange("password", event.target.value)}
            placeholder="••••••••"
          />
        </div>

        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none ring-0 transition focus:border-sky-400"
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                onInputChange("confirmPassword", event.target.value)
              }
              placeholder="••••••••"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700"
        >
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {status}
      </div>
    </div>
  );
}
