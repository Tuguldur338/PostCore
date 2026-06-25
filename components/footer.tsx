export function Footer() {
  return (
    <footer className="rounded-[1.5rem] border border-orange-200 bg-[#111827] px-6 py-5 text-sm text-slate-300 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 CaseCart. Built for simple, trusted case resale.</p>
        <div className="flex flex-wrap gap-4">
          <a href="#home" className="transition hover:text-white">
            Help
          </a>
          <a href="#cases" className="transition hover:text-white">
            Shipping
          </a>
          <a href="#account" className="transition hover:text-white">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
