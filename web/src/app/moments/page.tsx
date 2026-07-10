import Nav from "@/components/wedding/Nav";
import Footer from "@/components/wedding/Footer";
import { MomentsGallery } from "@/components/moments/MomentsGallery";
import { UploadModal } from "@/components/moments/UploadModal";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/auth";
import type { PagedPhotos } from "@/lib/types";

export default async function MomentsPage() {
  const user = await getCurrentUser();

  // Interim: the backend's GET /photos still requires a JWT, so the gallery is
  // behind the invitation login for now. When the backend makes /photos public
  // + approved-only, fetch unconditionally and gate only the UploadModal on `user`.
  let paged: PagedPhotos | null = null;
  if (user) {
    const res = await apiFetch("/photos", { params: { page: 1, pageSize: 24 } });
    if (res.ok) paged = (await res.json()) as PagedPhotos;
  }

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
          {user && (
            <div className="mt-8 flex justify-center">
              <UploadModal />
            </div>
          )}
        </div>
      </section>

      <section className="container pb-28 md:pb-40">
        {user && paged ? (
          <MomentsGallery initial={paged} />
        ) : (
          <div className="mx-auto max-w-md rounded-3xl border bg-card p-10 text-center shadow-soft">
            <p className="font-serif-display text-2xl text-foreground">Opening soon</p>
            <p className="mt-3 text-sm text-muted-foreground">
              The shared gallery is being prepared. Invited guests can sign in with their
              invitation QR code to view and add memories.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
