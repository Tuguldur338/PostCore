export function Intro() {
  return (
    <section
      id="home"
      className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#111827_100%)] p-6 text-white shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
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
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Shop featured cases
            </a>
            <a
              href="#account"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
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

        <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
          <img
            src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80"
            alt="Stylish premium phone cases"
            className="h-56 w-full rounded-[1.25rem] object-cover"
          />
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
