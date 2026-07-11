import Link from "next/link";
import Nav from "@/components/wedding/Nav";
import Footer from "@/components/wedding/Footer";
import { MomentsGallery } from "@/components/moments/MomentsGallery";
import { UploadModal } from "@/components/moments/UploadModal";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/auth";
import type { PagedPhotos } from "@/lib/types";

export default async function MomentsPage() {
  // The approved gallery is PUBLIC — GET /photos returns approved-only and needs
  // no auth, so we fetch and show it to everyone. Only uploading is gated: the
  // "Share a memory" action appears solely for authenticated (invited) guests.
  const user = await getCurrentUser();
  const res = await apiFetch("/photos", { params: { page: 1, pageSize: 24 } });
  const paged: PagedPhotos | null = res.ok ? ((await res.json()) as PagedPhotos) : null;
  const hasPhotos = !!paged && paged.data.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      <section className="relative pt-36 pb-12 md:pt-44 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-romance opacity-50" />
        <div className="container relative text-center">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">moments</p>
          <h1 className="font-serif-display text-4xl md:text-6xl text-foreground">
            Shared Memories
          </h1>
          <p className="mt-4 max-w-lg mx-auto text-muted-foreground font-light">
            Every photo and video from the celebration, gathered by everyone who was there.
          </p>
          <div className="mt-8 flex justify-center">
            {user ? (
              <UploadModal />
            ) : (
              <p className="text-sm text-muted-foreground">
                Invited guest?{" "}
                <Link href="/login" className="text-gold underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to add your photos.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="container pb-28 md:pb-40">
        {hasPhotos ? (
          <MomentsGallery initial={paged} />
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border bg-card p-10 text-center shadow-soft">
            <p className="font-serif-display text-2xl text-foreground">No memories yet</p>
            <p className="mt-3 text-sm text-muted-foreground">
              {user
                ? "Be the first to share a photo from the celebration."
                : "Approved photos from the celebration will appear here soon."}
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
