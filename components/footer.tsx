export function Footer() {
  return (
    <footer className="rounded-[1.8rem] border border-orange-200 bg-[#111827] px-6 py-10 text-sm text-slate-300 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.45)] sm:px-8 lg:px-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-lg font-semibold text-white">CaseCart</p>
          <p>
            Built for simple, trusted phone case resale with a calm shopping
            experience and clear seller tools.
          </p>
          <p className="text-slate-400">
            © 2026 CaseCart. All rights reserved.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 lg:min-w-[480px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Support
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#home"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Help center
                </a>
              </li>
              <li>
                <a
                  href="#cases"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Shipping info
                </a>
              </li>
              <li>
                <a
                  href="#account"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Contact us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Sell
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="/sell"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Add a product
                </a>
              </li>
              <li>
                <a
                  href="/account"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Seller account
                </a>
              </li>
              <li>
                <a
                  href="/contacts"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Support team
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
              Follow
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="#home"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#cases"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href="#account"
                  className="transition-colors duration-200 ease-out hover:text-white"
                >
                  Pinterest
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
