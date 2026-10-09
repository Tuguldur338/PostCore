"use client";

import { type MouseEvent } from "react";

let activeScrollFrame: number | null = null;

function animateScrollTo(targetTop: number) {
  if (activeScrollFrame !== null) {
    window.cancelAnimationFrame(activeScrollFrame);
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const duration = Math.min(750, Math.max(450, Math.abs(distance) * 0.45));
  const startedAt = performance.now();

  const step = (timestamp: number) => {
    const progress = Math.min(1, (timestamp - startedAt) / duration);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    window.scrollTo(0, startTop + distance * easedProgress);

    if (progress < 1) {
      activeScrollFrame = window.requestAnimationFrame(step);
    } else {
      activeScrollFrame = null;
    }
  };

  activeScrollFrame = window.requestAnimationFrame(step);
}

function scrollToSection(event: MouseEvent<HTMLAnchorElement>) {
  const targetId = event.currentTarget.getAttribute("href")?.slice(1);
  if (!targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  const targetTop = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - 112,
  );
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetTop);
  } else {
    animateScrollTo(targetTop);
  }
  window.history.replaceState(null, "", `#${targetId}`);
}

export function Intro() {
  return (
    <section
      id="home"
      className="intro-panel overflow-hidden rounded-[1.75rem] border border-orange-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#111827_100%)] p-6 text-white shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hero-reveal">
          <p className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-sm font-semibold text-orange-200">
            Campus essentials for everyday student life
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Shop school supplies, snacks, and student favorites in one easy
            place.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Discover notebooks, study tools, snacks, and essentials in a clean,
            student-friendly marketplace built for quick browsing.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#items"
              onClick={scrollToSection}
              className="smooth-transition rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400"
            >
              Shop student essentials
            </a>
            <a
              href="#account"
              onClick={scrollToSection}
              className="smooth-transition rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 ease-out hover:bg-white/15"
            >
              List an item
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Campus picks", "Notebooks", "Snacks", "Study tools"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="intro-feature hero-reveal-delay rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="intro-feature-list rounded-[1.25rem] border border-white/10 bg-[#111827]/70 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Curated this week
            </p>
            <ul className="mt-4 space-y-3 text-lg font-medium text-slate-100">
              <li>• Notebooks and study must-haves</li>
              <li>• Campus snacks and dorm favorites</li>
              <li>• Everyday essentials for student life</li>
            </ul>
          </div>
          <div className="intro-note mt-4 rounded-[1.25rem] border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-100">
            Quick campus finds for study days, snack breaks, and everyday
            routines.
          </div>
        </div>
      </div>
    </section>
  );
}
