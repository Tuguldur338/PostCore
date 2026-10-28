import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  ShieldCheck,
  Store,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Help & contact",
  description:
    "Help with listings, account access, orders, and campus pickup at PostCore, Orkhon School's student marketplace.",
};

const helpCards = [
  {
    icon: Store,
    title: "Listing help",
    description:
      "Questions about a price, condition, or pickup detail? Send the listing name and what you need to know.",
  },
  {
    icon: ShieldCheck,
    title: "Account help",
    description:
      "Locked out or waiting on a confirmation email? Tell us the email you used and we will point you to the right reset.",
  },
  {
    icon: Mail,
    title: "Order help",
    description:
      "Include your six-character order code. We can check the request status and who is reviewing it.",
  },
];

const safetyRules = [
  {
    title: "Meet on campus",
    body: "Use classrooms, the library, or a busy shared space. Skip home addresses and private locations.",
  },
  {
    title: "No online payment",
    body: "PostCore never takes card details. Nothing is charged through the site.",
  },
  {
    title: "Check it together",
    body: "Open the item, confirm what is included, and only then complete the hand-off.",
  },
  {
    title: "Tell an admin",
    body: "If a listing feels misleading or unsafe, report it to a marketplace admin right away.",
  },
];

const faqs = [
  {
    question: "How do I request an item?",
    answer:
      "Open a listing, choose Request to buy, set the quantity, and send it while signed in. The request is saved to your account and a student admin reviews it.",
  },
  {
    question: "Is payment handled on the website?",
    answer:
      "No. PostCore does not process payments or collect card details. You arrange the campus hand-off with the seller after the request is reviewed.",
  },
  {
    question: "Where do I collect my item?",
    answer:
      "Each listing can include a class, room, or a short meet-up note. If it does not, send the seller a message through the admin team and agree on a campus spot.",
  },
  {
    question: "Who can add listings?",
    answer:
      "Marketplace admins add and manage listings so every item has a clear photo, price, and pickup detail. If you want to sell something, contact the team.",
  },
  {
    question: "Why do I need an account?",
    answer:
      "Your account links requests to you, keeps your order codes in one place, and lets you save items for later. It also keeps buying and selling accountable.",
  },
  {
    question: "What happens when an item sells out?",
    answer:
      "Stock is checked at the moment you send a request. If someone requested the last item first, the site tells you before saving and you can choose something else.",
  },
];

export default function ContactsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Help & contact"
        title={
          <>
            The students behind <span className="display-italic">PostCore.</span>
          </>
        }
        description="A small team keeps the shelves tidy, reviews requests, and helps with account trouble. Find the right starting point below."
        actions={
          <>
            <a href="mailto:hello@postcore.student" className="btn btn-primary">
              <Mail size={16} />
              Email the team
            </a>
            <Link href="/products" className="btn btn-secondary">
              Browse the market
              <ArrowRight size={15} className="arrow-slide" />
            </Link>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        {helpCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-soft text-pine">
                <Icon size={19} />
              </span>
              <h2 className="mt-4 font-display text-xl tracking-tight text-ink">
                {card.title}
              </h2>
              <p className="mt-1.5 text-[0.8rem] leading-6 text-muted">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="eyebrow">Reach us</p>
          <h2 className="section-title mt-3">
            One inbox, real <span className="display-italic">students.</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Email is the most reliable way to reach the team. Include the listing
            or order code when you can — it helps us find the right record faster.
          </p>

          <div className="mt-6 grid gap-2">
            <a
              href="mailto:hello@postcore.student"
              className="group flex items-center justify-between rounded-xl border border-line bg-surface-2/60 px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-soft text-pine">
                  <Mail size={17} />
                </span>
                <span>
                  <span className="block text-[0.7rem] font-medium text-muted">Email</span>
                  <span className="block text-sm font-semibold text-ink">
                    hello@postcore.student
                  </span>
                </span>
              </span>
              <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-1" />
            </a>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft text-[#7a5412]">
                <Clock size={17} />
              </span>
              <span>
                <span className="block text-[0.7rem] font-medium text-muted">Hours</span>
                <span className="block text-sm font-semibold text-ink">
                  Monday to Friday · 9:00–18:00
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-soft text-blue">
                <MapPin size={17} />
              </span>
              <span>
                <span className="block text-[0.7rem] font-medium text-muted">Find us</span>
                <span className="block text-sm font-semibold text-ink">
                  Orkhon School campus
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#163d31] p-6 text-[#f7f1e4] sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-12 h-48 w-48 rounded-full border-[24px] border-white/[0.06]"
          />
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-gold">
            A quick note
          </p>
          <h2 className="mt-3 font-display text-[2rem] leading-[1.06] tracking-[-0.025em]">
            Keep every hand-off
            <br />
            <span className="italic text-gold">on campus.</span>
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            PostCore is built around school. Meet in shared spaces, keep the
            exchange visible, and ask an admin if something feels off.
          </p>
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" />
            <p className="text-[0.78rem] leading-5 text-white/75">
              Never share passwords, bank details, or a home address in a listing
              or message.
            </p>
          </div>
          <Link
            href="#safety"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold underline decoration-white/20 underline-offset-4"
          >
            Read the safety guide
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28">
        <div className="rounded-2xl border border-line bg-paper-deep p-6 sm:p-8">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title mt-3">
            Browse, request, <span className="display-italic">collect.</span>
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Find it",
                body: "Search the market or browse a category. Save anything you want to come back to.",
              },
              {
                step: "02",
                title: "Request it",
                body: "Sign in, choose a quantity, and send the request. No payment details are needed.",
              },
              {
                step: "03",
                title: "Pick it up",
                body: "A student admin reviews the request, then you arrange a campus hand-off.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-line bg-surface p-4">
                <span className="font-mono text-[0.62rem] font-bold text-line-strong">
                  {item.step}
                </span>
                <h3 className="mt-2 font-display text-lg tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-[0.76rem] leading-5 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="scroll-mt-28">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Safety & pickup</p>
            <h2 className="section-title mt-3">
              A simple swap, <span className="display-italic">done safely.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              The best campus exchanges are boring: a public spot, the item in
              hand, and no surprises. These four rules cover almost everything.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {safetyRules.map((rule) => (
              <div
                key={rule.title}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-soft text-pine">
                  <CheckCircle size={16} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{rule.title}</h3>
                <p className="mt-1 text-[0.76rem] leading-5 text-muted">{rule.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-3">
              The questions we <span className="display-italic">actually get.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Still stuck? Email the team with your order code or listing name and
              we will take it from there.
            </p>
            <a href="mailto:hello@postcore.student" className="btn btn-secondary mt-5">
              <Mail size={15} />
              Ask the team
            </a>
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {faqs.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-[0.8rem] leading-6 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
