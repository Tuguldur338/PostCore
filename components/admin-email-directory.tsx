"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck } from "@/components/icons";

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
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#7a5412]">
          <ShieldCheck size={19} />
        </span>
        <div>
          <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-accent-strong">
            Admin only
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight text-ink">
            Registered accounts
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Passwords are private and cannot be viewed. Use account recovery
            emails to help someone back in.
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rose/25 bg-rose-soft px-3.5 py-2.5 text-sm text-rose"
        >
          {error}
        </p>
      ) : emails?.length ? (
        <>
          <div className="relative mt-5">
            <label htmlFor="admin-email-search" className="sr-only">
              Search registered emails
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="admin-email-search"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email address"
              className="field pl-9"
            />
          </div>
          <p className="mt-2 text-[0.72rem] font-medium text-muted" aria-live="polite">
            Showing {displayedEmails.length} of {matchingEmails.length}{" "}
            {matchingEmails.length === 1 ? "matching email" : "matching emails"}
          </p>
          {displayedEmails.length ? (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {displayedEmails.map((email) => (
                <li
                  key={email}
                  className="break-all rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[0.72rem] text-ink-soft"
                >
                  {email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">
              No registered email matches that search.
            </p>
          )}
          {matchingEmails.length > displayedEmails.length ? (
            <p className="mt-2 text-[0.7rem] text-muted">
              A maximum of 10 addresses are shown at a time. Refine the search to
              narrow the list.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-5 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted">
          No registered email addresses were found.
        </p>
      )}
    </section>
  );
}
