"use client";

import { useEffect, useState } from "react";

type DirectoryResponse = {
  message?: string;
  emails?: string[];
};

export function AdminEmailDirectory() {
  const [emails, setEmails] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const matchingEmails =
    emails?.filter((email) =>
      email.toLowerCase().includes(search.trim().toLowerCase()),
    ) ?? [];
  const displayedEmails = matchingEmails.slice(0, 10);

  useEffect(() => {
    let isActive = true;

    const loadDirectory = async () => {
      try {
        const response = await fetch("/api/admin/account-directory", {
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) return;

        const result = (await response.json()) as DirectoryResponse;
        if (!response.ok) {
          throw new Error(
            result.message ?? "Registered email addresses could not be loaded.",
          );
        }
        if (isActive) setEmails(result.emails ?? []);
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Registered email addresses could not be loaded.",
          );
        }
      }
    };

    void loadDirectory();
    return () => {
      isActive = false;
    };
  }, []);

  if (emails === null && !error) return null;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">
          ADMIN only
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Registered email addresses
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Passwords are private and cannot be viewed; reset emails are the safe
          way to recover an account.
        </p>
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : emails?.length ? (
        <>
          <label
            htmlFor="admin-email-search"
            className="mt-5 block text-sm font-semibold text-slate-700"
          >
            Search registered emails
          </label>
          <div className="relative mt-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            >
              <circle
                cx="10.8"
                cy="10.8"
                r="6.8"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m16 16 4.2 4.2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
            <input
              id="admin-email-search"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type an email address"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </div>
          <p
            className="mt-2 text-xs font-medium text-slate-500"
            aria-live="polite"
          >
            Showing {displayedEmails.length} of {matchingEmails.length}{" "}
            {matchingEmails.length === 1 ? "matching email" : "matching emails"}
          </p>
          {displayedEmails.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {displayedEmails.map((email) => (
                <li
                  key={email}
                  className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  {email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No registered email matches that search.
            </p>
          )}
          {matchingEmails.length > displayedEmails.length ? (
            <p className="mt-3 text-xs text-slate-500">
              Refine your search to narrow down the results. A maximum of 10
              email addresses are shown at a time.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No registered email addresses were found.
        </p>
      )}
    </section>
  );
}
