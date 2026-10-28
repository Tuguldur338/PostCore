import type { Metadata } from "next";
import { OrdersGate } from "@/components/orders-gate";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Order desk",
  description: "Review PostCore purchase requests and update order status.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin workspace"
        title={
          <>
            The order <span className="display-italic">desk.</span>
          </>
        }
        description="Review every purchase request, mark a hand-off as complete, and manage marketplace roles. Sign in with an admin account to begin."
      />
      <OrdersGate />
    </PageShell>
  );
}
