import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SavedItems } from "@/components/saved-cases";

export default function SavedPage() {
  return (
    <div className="site-shell min-h-screen p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header />
        <SavedItems />
        <Footer />
      </main>
    </div>
  );
}
