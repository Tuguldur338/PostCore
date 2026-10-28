import type { Metadata } from "next";
import { AccountView } from "@/components/account-view";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your PostCore profile, purchase receipts, and account security.",
  robots: { index: false, follow: false },
};

type AccountPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const tab =
    params.tab === "receipts" || params.tab === "security" ? params.tab : "profile";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your account"
        title={
          <>
            Your corner of <span className="display-italic">PostCore.</span>
          </>
        }
        description="Everything tied to your student account: your saved shelf, the requests you have sent, and the security settings that keep it yours."
      />
      <AccountView initialTab={tab} />
    </PageShell>
  );
}
