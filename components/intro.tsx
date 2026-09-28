"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";

const heroImages = [
  { src: "/images/cases/arctic-frost.svg", alt: "Arctic Frost phone case" },
  { src: "/images/cases/aura-marble.jpg", alt: "Marble phone case" },
  { src: "/images/cases/aura-marble.svg", alt: "Marble phone case design" },
  { src: "/images/cases/carbon-edge.svg", alt: "Carbon Edge phone case" },
  { src: "/images/cases/clear-shell.svg", alt: "Clear Shell phone case" },
  { src: "/images/cases/coastal-wave.svg", alt: "Coastal Wave phone case" },
  { src: "/images/cases/crystal-shield.svg", alt: "Crystal Shield phone case" },
  { src: "/images/cases/leather-drift.svg", alt: "Leather Drift phone case" },
  { src: "/images/cases/magsafe-shell.svg", alt: "MagSafe Shell phone case" },
  { src: "/images/cases/matte-smooth.svg", alt: "Matte Smooth phone case" },
  { src: "/images/cases/midnight-grip.jpg", alt: "Midnight grip phone case" },
  {
    src: "/images/cases/midnight-grip.svg",
    alt: "Midnight Grip phone case art",
  },
  { src: "/images/cases/neon-pop.svg", alt: "Neon Pop phone case" },
  { src: "/images/cases/premium-silk.svg", alt: "Premium Silk phone case" },
  { src: "/images/cases/rugged-shield.svg", alt: "Rugged Shield phone case" },
  { src: "/images/cases/sunset-luxe.jpg", alt: "Sunset phone case" },
  { src: "/images/cases/sunset-luxe.svg", alt: "Sunset Luxe phone case art" },
  { src: "/images/cases/velvet-bloom.svg", alt: "Velvet Bloom phone case" },
];

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
  const [imageOffset, setImageOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalId = window.setInterval(() => {
      setImageOffset((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, []);

  const showPreviousImages = () => {
    setImageOffset(
      (current) => (current - 1 + heroImages.length) % heroImages.length,
    );
  };

  const showNextImages = () => {
    setImageOffset((current) => (current + 1) % heroImages.length);
  };

  return (
    <section
      id="home"
      className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#111827_100%)] p-6 text-white shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hero-reveal">
          <p className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-sm font-semibold text-orange-200">
            Premium accessories, styled for everyday life
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Shop standout phone cases with the feel of a modern marketplace.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Discover clear shells, textured grips, and sleek finishes in a
            clean, inviting shopping experience built for easy browsing.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#cases"
              onClick={scrollToSection}
              className="smooth-transition rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400"
            >
              Shop featured cases
            </a>
            <a
              href="#account"
              onClick={scrollToSection}
              className="smooth-transition rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors duration-200 ease-out hover:bg-white/15"
            >
              Start selling
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Clear cases", "MagSafe", "Matte finish", "Tough shell"].map(
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

        <div className="hero-reveal-delay rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
          <div className="relative h-56 overflow-hidden rounded-[1.25rem] bg-slate-950/30">
            <Image
              key={heroImages[imageOffset].src}
              src={heroImages[imageOffset].src}
              alt={heroImages[imageOffset].alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={showPreviousImages}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/10"
              aria-label="Show previous case photos"
              title="Show previous case photos"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={showNextImages}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:bg-white/10"
              aria-label="Show next case photos"
              title="Show next case photos"
            >
              Next
            </button>
          </div>
          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-[#111827]/70 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Curated this week
            </p>
            <p className="mt-2 text-xl font-semibold">
              Bold designs, secure finishes, and a smoother shopping feel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
