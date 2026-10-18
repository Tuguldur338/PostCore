import Link from "next/link";
import { AdminEmailDirectory } from "@/components/admin-email-directory";
import { AccountPassword } from "@/components/account-password";
import { AccountReceipts } from "@/components/account-receipts";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function AccountPage() {
  return (
    <div className="site-shell min-h-screen p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-6">
        <Header />

        <AccountReceipts />

        <AdminEmailDirectory />

        <AccountPassword />

        <Link
          href="/"
          className="smooth-transition inline-flex self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-sky-600"
        >
          Back to home
        </Link>

        <Footer />
      </main>
    </div>
  );
}
