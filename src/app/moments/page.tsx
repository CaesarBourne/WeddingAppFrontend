import Nav from "@/components/wedding/Nav";
import Footer from "@/components/wedding/Footer";
import { MomentsPageClient } from "@/components/moments/MomentsPageClient";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/auth";
import type { PagedPhotos, PhotoDto } from "@/lib/types";

export default async function MomentsPage() {
  const user = await getCurrentUser();

  // Fetch first page for the masonry "All" view, and a full batch (max 100)
  // for the "By Guest" grouped view — both are public endpoints.
  const [pagedRes, groupedRes] = await Promise.all([
    apiFetch("/photos", { params: { page: 1, pageSize: 24 } }),
    apiFetch("/photos", { params: { page: 1, pageSize: 100 } }),
  ]);

  const paged: PagedPhotos | null = pagedRes.ok ? ((await pagedRes.json()) as PagedPhotos) : null;
  const groupedPaged: PagedPhotos | null = groupedRes.ok
    ? ((await groupedRes.json()) as PagedPhotos)
    : null;
  const grouped: PhotoDto[] = groupedPaged?.data ?? [];

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      <section className="relative overflow-hidden pb-12 pt-36 md:pb-16 md:pt-44">
        <div className="absolute inset-0 bg-gradient-romance opacity-50" />
        <div className="container relative text-center">
          <p className="font-script mb-2 text-3xl text-gradient-gold md:text-4xl">moments</p>
          <h1 className="font-serif-display text-4xl text-foreground md:text-6xl">
            Shared Memories
          </h1>
          <p className="mx-auto mt-4 max-w-lg font-light text-muted-foreground">
            Every photo and video from the celebration, gathered by everyone who was there.
          </p>
        </div>
      </section>

      <section className="container pb-28 md:pb-40">
        <MomentsPageClient initial={paged} grouped={grouped} user={user} />
      </section>

      <Footer />
    </main>
  );
}
