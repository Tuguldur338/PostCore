"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  Receipt,
  ShieldCheck,
  Spinner,
  Users,
} from "@/components/icons";
import { OrdersDashboard } from "@/app/orders/orders-dashboard";

export function OrdersGate() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-[36vh] flex-col items-center justify-center gap-3 text-sm text-muted">
        <Spinner size={22} className="text-accent" />
        Checking your access…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-9">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-[#7a5412]">
            <Lock size={22} />
          </span>
          <h2 className="mt-5 font-display text-3xl tracking-[-0.025em] text-ink">
            The order desk is for admins.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Sign in with the account a marketplace admin assigned to you to review
            requests, update hand-offs, and manage the shelves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/signin?next=/orders" className="btn btn-primary">
              Sign in
              <ArrowRight size={15} />
            </Link>
            <Link href="/contacts" className="btn btn-secondary">
              Ask an admin
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-paper-deep p-6 sm:p-8">
          <p className="eyebrow">Inside the desk</p>
          <ul className="mt-5 space-y-4">
            <li className="flex items-start gap-3">
              <Receipt size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                See every request with its order code and quantity.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                Mark hand-offs complete and remove test orders.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Users size={18} className="mt-0.5 text-pine" />
              <p className="text-sm leading-6 text-ink-soft">
                Marketplace admins can assign student and admin badges.
              </p>
            </li>
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-[0.7rem] leading-5 text-muted">
            Admin access is checked against your marketplace profile on every
            visit.
          </p>
        </div>
      </div>
    );
  }

  if (user.role === "student") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-soft text-pine">
          <ShieldCheck size={26} />
        </span>
        <h2 className="mt-5 font-display text-3xl tracking-tight text-ink">
          Your account is a student account.
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You can browse, save, request items, and track your receipts. The order
          desk is limited to marketplace admins.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/account?tab=receipts" className="btn btn-primary">
            My receipts
            <ArrowRight size={15} />
          </Link>
          <Link href="/products" className="btn btn-secondary">
            Browse the market
          </Link>
        </div>
      </div>
    );
  }

  return <OrdersDashboard />;
}
