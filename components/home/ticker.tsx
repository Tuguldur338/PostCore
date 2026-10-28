const tickerItems = [
  "Notebooks",
  "Campus snacks",
  "Study tools",
  "Phone cases",
  "Art supplies",
  "Everyday essentials",
  "Exam week fuel",
  "Desk finds",
];

export function Ticker() {
  return (
    <div className="relative flex overflow-hidden border-y border-line bg-pine-deep text-on-pine">
      <p className="sr-only">
        Categories on PostCore: notebooks, campus snacks, study tools, phone
        cases, art supplies, and everyday essentials.
      </p>
      <div
        aria-hidden="true"
        className="relative z-10 flex shrink-0 items-center gap-2 border-r border-white/15 bg-pine-deep px-4 py-3 sm:px-6"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        <span className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-gold">
          The shelves
        </span>
      </div>
      <div className="ticker min-w-0 flex-1 py-3" aria-hidden="true">
        <div className="ticker-track items-center gap-8 pr-8">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-8">
              {tickerItems.map((item) => (
                <span
                  key={`${copy}-${item}`}
                  className="flex items-center gap-8 whitespace-nowrap font-display text-lg tracking-tight text-on-pine/90"
                >
                  {item}
                  <span className="text-sm text-gold">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
