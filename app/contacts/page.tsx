import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_30%),linear-gradient(135deg,#f7f9fc_0%,#eef2f7_100%)] p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-6">
        <Header />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Reach the CaseCart team
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Need help with a listing, account setup, or anything else? Send us a
            note and we will get back to you shortly.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Email</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                hello@casecart.example
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Hours</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Mon to Fri • 9:00 to 18:00
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
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
