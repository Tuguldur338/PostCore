import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SignInView } from "@/components/signin-view";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PostCore to request items, save finds, and track pickups.",
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "sign-in";
  const rawNext = typeof params.next === "string" ? params.next : "/";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  return (
    <PageShell>
      <SignInView key={mode} initialMode={mode} nextPath={nextPath} />
    </PageShell>
  );
}
