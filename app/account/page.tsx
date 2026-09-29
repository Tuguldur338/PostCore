import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function AccountPage() {
  return (
    <div className="site-shell min-h-screen p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-6">
        <Header />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Manage your student seller profile
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Sign in, update your profile picture, and keep your campus resale
            presence polished from one simple place.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Profile tools
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Upload a profile image and keep your account details ready for
                buyers.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick access
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Use the account section on the home page to sign in or create a
                new account.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="smooth-transition inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-sky-600"
            >
              Back to home
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
