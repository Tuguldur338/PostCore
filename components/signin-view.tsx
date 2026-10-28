"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  MapPin,
  Package,
  Spinner,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { authSetupMessage } from "@/lib/auth-errors";

type Mode = "sign-in" | "register";

type SignInViewProps = {
  initialMode: Mode;
  nextPath: string;
};

const benefits = [
  {
    icon: Heart,
    title: "Keep your finds",
    description: "Save items and come back when you are ready to request them.",
  },
  {
    icon: Package,
    title: "Track every request",
    description: "Your order codes and pickup details live in one place.",
  },
  {
    icon: MapPin,
    title: "Collect on campus",
    description: "No delivery addresses, just a classroom or campus hand-off.",
  },
];

export function SignInView({ initialMode, nextPath }: SignInViewProps) {
  const router = useRouter();
  const {
    user,
    isReady,
    isConfigured,
    sessionError,
    signIn,
    register,
    resendConfirmation,
  } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setStatus("");
    setNeedsConfirmation(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (mode === "register") {
      if (!name.trim()) {
        setError("Add your name so sellers know who is requesting the item.");
        return;
      }
      if (password.length < 8) {
        setError("Choose a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("The two passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const result = await register({ name, email, password });
        if (result.needsConfirmation) {
          setNeedsConfirmation(true);
          setStatus(result.message ?? "Check your inbox to confirm your email.");
          setPassword("");
          setConfirmPassword("");
          return;
        }
        router.replace(nextPath);
        router.refresh();
        return;
      }

      await signIn(email, password);
      router.replace(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setStatus("");
    setIsSubmitting(true);
    try {
      await resendConfirmation(email);
      setStatus(
        "If this address has a pending registration, a fresh confirmation email is on its way. Check your spam folder too.",
      );
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "The confirmation email could not be sent.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[46vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <Spinner size={22} className="text-accent" />
        Opening your account…
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-sm)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-soft text-pine">
          <CheckCircle size={26} />
        </span>
        <h1 className="page-title mt-5 text-[2.4rem]">You are already in.</h1>
        <p className="lede mt-3 text-sm">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/account" className="btn btn-primary">
            My account
            <ArrowRight size={15} />
          </Link>
          <Link href="/products" className="btn btn-secondary">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
      <section className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Account access</p>
            <h1 className="page-title mt-3 text-[clamp(2.4rem,4.5vw,3.4rem)]">
              {mode === "sign-in" ? (
                <>
                  Welcome <span className="display-italic">back.</span>
                </>
              ) : (
                <>
                  Join the <span className="display-italic">market.</span>
                </>
              )}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              {mode === "sign-in"
                ? "Sign in to request items, keep your saved shelf, and find your order codes."
                : "Create one account for buying, saving, and keeping track of every campus pickup."}
            </p>
          </div>
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>

        {!isConfigured ? (
          <div className="mt-6 rounded-2xl border border-accent/25 bg-accent-soft p-4 text-sm leading-6 text-ink">
            <p className="font-semibold">Sign-in is not connected yet.</p>
            <p className="mt-1 text-ink-soft">{authSetupMessage}</p>
          </div>
        ) : null}

        {sessionError ? (
          <p className="mt-5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[0.78rem] leading-5 text-muted">
            {sessionError}
          </p>
        ) : null}

        {needsConfirmation ? (
          <div className="mt-7">
            <div className="rounded-2xl border border-pine/20 bg-pine-soft p-5 text-pine">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-on-pine">
                  <Mail size={17} />
                </span>
                <p className="font-semibold">Check your inbox</p>
              </div>
              <p className="mt-3 text-sm leading-6">{status}</p>
              <p className="mt-2 text-[0.8rem] leading-5 opacity-80">
                Confirmation is sent to{" "}
                <span className="font-semibold">{email.trim()}</span>.
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={isSubmitting}
                className="btn btn-secondary btn-block"
              >
                {isSubmitting ? <Spinner size={16} /> : null}
                Resend confirmation email
              </button>
              <button
                type="button"
                onClick={() => {
                  setNeedsConfirmation(false);
                  setMode("sign-in");
                }}
                className="btn btn-ghost btn-block"
              >
                Back to sign in
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 inline-flex rounded-full border border-line bg-surface-2 p-1">
              {(
                [
                  { value: "sign-in", label: "Sign in" },
                  { value: "register", label: "Register" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => changeMode(tab.value)}
                  aria-pressed={mode === tab.value}
                  className={`rounded-full px-4 py-1.5 text-[0.8rem] font-semibold transition-colors ${
                    mode === tab.value
                      ? "bg-surface text-ink shadow-[var(--shadow-sm)]"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {mode === "register" ? (
                <div>
                  <label className="field-label" htmlFor="signup-name">
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className="field"
                    placeholder="Ari Johnson"
                    required
                  />
                </div>
              ) : null}

              <div>
                <label className="field-label" htmlFor="signup-email">
                  School or personal email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="field pr-12"
                    placeholder="At least 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === "register" ? (
                <div>
                  <label className="field-label" htmlFor="signup-confirm">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      className="field pr-12"
                      placeholder="Type it again"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((visible) => !visible)}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                      aria-pressed={showConfirm}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-rose/25 bg-rose-soft px-3.5 py-3 text-[0.8rem] leading-5 text-rose"
                >
                  {error}
                </p>
              ) : null}

              {status && !needsConfirmation ? (
                <p
                  role="status"
                  className="rounded-xl border border-pine/20 bg-pine-soft px-3.5 py-3 text-[0.8rem] leading-5 text-pine"
                >
                  {status}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="btn btn-primary btn-lg btn-block"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={17} />
                    {mode === "register" ? "Creating account…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {mode === "register" ? "Create account" : "Sign in"}
                    <ArrowRight size={16} className="arrow-slide" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 flex items-start gap-2 text-[0.72rem] leading-5 text-muted">
              <Lock size={13} className="mt-0.5 shrink-0 text-pine" />
              Accounts are secured by Supabase. PostCore never sees or stores your
              password, and no payment details are collected.
            </p>
          </>
        )}
      </section>

      <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#163d31] p-7 text-[#f7f1e4] sm:p-9">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/[0.06]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-gold/10 blur-2xl"
        />
        <div className="relative flex h-full flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Why sign in
          </span>
          <h2 className="mt-5 font-display text-[clamp(2rem,3.5vw,2.8rem)] leading-[1.05] tracking-[-0.025em]">
            One account,
            <br />
            <span className="italic text-gold">the whole market.</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
            PostCore is built around campus. Your account keeps your requests,
            receipts, and saved shelf together.
          </p>

          <ul className="mt-7 space-y-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gold">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{benefit.title}</p>
                    <p className="mt-0.5 text-[0.76rem] leading-5 text-white/60">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                A typical order code
              </p>
              <p className="mt-1.5 font-mono text-2xl font-bold tracking-[0.18em] text-gold">
                7KQ2MP
              </p>
              <p className="mt-2 text-[0.72rem] leading-5 text-white/55">
                Write it down or find it any time under Account → Receipts.
              </p>
            </div>
            <p className="mt-4 text-[0.7rem] text-white/40">
              Student-run · Orkhon School · No online payments
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
