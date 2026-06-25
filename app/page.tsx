import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Storefront } from "@/components/storefront";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_30%),linear-gradient(135deg,#f7f9fc_0%,#eef2f7_100%)] p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-6">
        <Header />
        <Storefront />
        <Footer />
      </main>
    </div>
  );
}
