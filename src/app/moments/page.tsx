import Nav from "@/components/wedding/Nav";
import Footer from "@/components/wedding/Footer";
import { MomentsPageClient } from "@/components/moments/MomentsPageClient";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/auth";
import type { PagedPhotos } from "@/lib/types";

export default async function MomentsPage() {
  const user = await getCurrentUser();

  // Single fetch — small page so HTML reaches the browser fast.
  // The "By Guest" grouped view loads lazily on first tab-switch (client-side).
  const res = await apiFetch("/photos", { params: { page: 1, pageSize: 24 } });
  const paged: PagedPhotos | null = res.ok ? ((await res.json()) as PagedPhotos) : null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Compact header — just enough to clear the fixed nav */}
      <div className="pt-20 pb-4 text-center md:pt-24 md:pb-6">
        <p className="font-script text-xl text-gradient-gold md:text-2xl">wedding gallery</p>
        <h1 className="font-serif-display mt-0.5 text-2xl text-foreground md:text-3xl">
          Shared Memories
        </h1>
      </div>

      <section className="container pb-24 md:pb-36">
        <MomentsPageClient initial={paged} user={user} />
      </section>

      <Footer />
    </main>
  );
}
