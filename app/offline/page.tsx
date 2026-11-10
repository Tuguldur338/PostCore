export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        PostCore
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        You’re offline
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-muted">
        Connect to the internet to browse the marketplace. Your account and
        marketplace information are not stored for offline use.
      </p>
      <form action="/" method="get" className="mt-8">
        <button type="submit" className="btn btn-primary">
          Try again
        </button>
      </form>
    </main>
  );
}
