"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { AccountPassword } from "@/components/account-password";
import { AccountReceipts } from "@/components/account-receipts";
import { AdminEmailDirectory } from "@/components/admin-email-directory";
import { useSavedCount } from "@/components/favorites";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Heart,
  LogOut,
  Receipt,
  ShieldCheck,
  Spinner,
  Store,
  User,
} from "@/components/icons";
import type { User as MarketplaceUser } from "@/components/types";

type AccountTab = "profile" | "receipts" | "security";

const tabs: { value: AccountTab; label: string; icon: typeof User }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "receipts", label: "Receipts", icon: Receipt },
  { value: "security", label: "Security", icon: ShieldCheck },
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PC"
  );
}

function getRoleLabel(role: MarketplaceUser["role"]) {
  if (role === "admin") return "ADMIN";
  if (role === "marketplace_admin") return "Marketplace admin";
  return "Student";
}

async function prepareAvatar(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image could not be opened."));
      element.src = objectUrl;
    });

    const size = 512;
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image editing is unavailable in this browser.");
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size,
    );
    return canvas.toDataURL("image/webp", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AccountView({ initialTab }: { initialTab: AccountTab }) {
  const router = useRouter();
  const { user, isReady, updateAvatar, signOut } = useAuth();
  const savedCount = useSavedCount();
  const [tab, setTab] = useState<AccountTab>(initialTab);
  const [imageError, setImageError] = useState("");
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeTab = (nextTab: AccountTab) => {
    setTab(nextTab);
    window.history.replaceState(
      null,
      "",
      nextTab === "profile" ? "/account" : `/account?tab=${nextTab}`,
    );
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageError("");
    setIsPreparingImage(true);
    try {
      const imageData = await prepareAvatar(file);
      updateAvatar(imageData);
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "The photo could not be updated.",
      );
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutError("");
    setIsSigningOut(true);
    try {
      await signOut();
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Could not sign out. Try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[36vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <Spinner size={22} className="text-accent" />
        Loading your account…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-9">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-soft text-pine">
            <User size={22} />
          </span>
          <h2 className="mt-5 font-display text-3xl tracking-[-0.025em] text-ink">
            Sign in to open your corner.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Your PostCore account keeps your saved shelf, purchase requests, and
            pickup codes together. It takes a minute to set up.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/signin?next=/account" className="btn btn-primary">
              Sign in
              <ArrowRight size={15} />
            </Link>
            <Link href="/signin?mode=register&next=/account" className="btn btn-secondary">
              Create an account
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-paper-deep p-6 sm:p-8">
          <p className="eyebrow">Included with your account</p>
          <ul className="mt-5 space-y-4">
            <li className="flex items-start gap-3">
              <Receipt size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                Receipts with order codes for every request.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Heart size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                A saved shelf that keeps your favourite finds together.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Store size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                Seller tools if a marketplace admin adds you to the team.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                No online payments — PostCore never stores card details.
              </p>
            </li>
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-5 text-muted">
            Accounts are secured by Supabase. Profile photos stay on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="bg-dots pointer-events-none absolute -right-10 -top-12 h-48 w-48 opacity-30 [mask-image:radial-gradient(circle,black,transparent_70%)]"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-pine-soft text-pine shadow-[var(--shadow-md)] ring-1 ring-line">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={`${user.name}'s profile photo`}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold">
                  {getInitials(user.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="chip chip-pine border-transparent">
                <ShieldCheck size={12} />
                {getRoleLabel(user.role)}
              </span>
              <h2 className="mt-2 truncate font-display text-[2rem] leading-tight tracking-[-0.025em] text-ink">
                {user.name}
              </h2>
              <p className="truncate text-[0.8rem] text-muted">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label="Change profile photo"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPreparingImage}
              className="btn btn-secondary btn-sm"
            >
              {isPreparingImage ? <Spinner size={14} /> : <Camera size={15} />}
              {isPreparingImage ? "Preparing…" : "Change photo"}
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="btn btn-ghost btn-sm text-muted"
            >
              {isSigningOut ? <Spinner size={14} /> : <LogOut size={15} />}
              Sign out
            </button>
          </div>
        </div>
        {imageError ? (
          <p role="alert" className="relative mt-3 text-[0.76rem] font-medium text-rose">
            {imageError}
          </p>
        ) : null}
        {signOutError ? (
          <p role="alert" className="relative mt-3 text-[0.76rem] font-medium text-rose">
            {signOutError}
          </p>
        ) : null}
        <p className="relative mt-3 text-[0.68rem] text-muted">
          Your profile photo is stored in this browser only; it is not uploaded to
          the marketplace.
        </p>
      </div>

      <div
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1"
        role="tablist"
        aria-label="Account sections"
      >
        {tabs.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.value}
              id={`account-tab-${entry.value}`}
              type="button"
              role="tab"
              aria-selected={tab === entry.value}
              aria-controls="account-tabpanel"
              onClick={() => changeTab(entry.value)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.8rem] font-semibold transition-colors ${
                tab === entry.value
                  ? "bg-ink text-paper"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {entry.label}
            </button>
          );
        })}
      </div>

      <div
        id="account-tabpanel"
        role="tabpanel"
        aria-labelledby={`account-tab-${tab}`}
      >
        {tab === "profile" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-pine" />
                <h2 className="font-display text-2xl tracking-tight text-ink">
                  Account details
                </h2>
              </div>
              <dl className="mt-5 grid gap-3">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <dt className="text-[0.76rem] text-muted">Name</dt>
                  <dd className="truncate text-right text-sm font-semibold text-ink">
                    {user.name}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <dt className="text-[0.76rem] text-muted">Email</dt>
                  <dd className="truncate text-right text-sm font-semibold text-ink">
                    {user.email}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[0.76rem] text-muted">Marketplace role</dt>
                  <dd className="text-right text-sm font-semibold text-ink">
                    {getRoleLabel(user.role)}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-[0.7rem] leading-5 text-muted">
                Need to change your name or email? Ask a marketplace admin to help
                with account recovery.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
                <h2 className="font-display text-2xl tracking-tight text-ink">
                  Quick links
                </h2>
                <div className="mt-4 grid gap-2">
                  <Link
                    href="/saved"
                    className="group flex items-center justify-between rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2">
                      <Heart size={16} className="text-accent-strong" />
                      Saved items
                    </span>
                    <span className="flex items-center gap-2 text-muted">
                      {savedCount}
                      <ArrowRight size={14} className="arrow-slide" />
                    </span>
                  </Link>
                  <Link
                    href="/products"
                    className="group flex items-center justify-between rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2">
                      <Store size={16} className="text-pine" />
                      Browse the market
                    </span>
                    <ArrowRight size={14} className="arrow-slide text-muted" />
                  </Link>
                  {user.role === "admin" || user.role === "marketplace_admin" ? (
                    <>
                      <Link
                        href="/orders"
                        className="group flex items-center justify-between rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                      >
                        <span className="flex items-center gap-2">
                          <Receipt size={16} className="text-blue" />
                          Order desk
                        </span>
                        <ArrowRight size={14} className="arrow-slide text-muted" />
                      </Link>
                      <Link
                        href="/sell"
                        className="group flex items-center justify-between rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
                      >
                        <span className="flex items-center gap-2">
                          <Store size={16} className="text-gold" />
                          Add a listing
                        </span>
                        <ArrowRight size={14} className="arrow-slide text-muted" />
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-pine-soft/60 p-5 text-pine">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={16} />
                  Your data stays yours
                </p>
                <p className="mt-1.5 text-[0.76rem] leading-5 opacity-80">
                  PostCore never stores payment details. Passwords are handled by
                  Supabase and are never shown to admins.
                </p>
              </div>
            </div>

            {user.role === "admin" ? (
              <div className="lg:col-span-2">
                <AdminEmailDirectory />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "receipts" ? <AccountReceipts /> : null}
        {tab === "security" ? <AccountPassword /> : null}
      </div>
    </div>
  );
}
