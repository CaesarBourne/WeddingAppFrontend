import Nav from "@/components/wedding/Nav";
import Hero from "@/components/wedding/Hero";
import Story from "@/components/wedding/Story";
import Proposal from "@/components/wedding/Proposal";
import Details from "@/components/wedding/Details";
import { UploadedGallery } from "@/components/wedding/UploadedGallery";
import Gallery from "@/components/wedding/Gallery";
import VideoSection from "@/components/wedding/VideoSection";
import Gift from "@/components/wedding/Gift";
import Footer from "@/components/wedding/Footer";
import { apiFetch } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/auth";
import type { PagedPhotos } from "@/lib/types";

export default async function Home() {
  const [res, user] = await Promise.all([
    apiFetch("/photos", { params: { page: 1, pageSize: 12 } }),
    getCurrentUser(),
  ]);
  const paged: PagedPhotos = res.ok
    ? ((await res.json()) as PagedPhotos)
    : { data: [], meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };

  return (
    <main className="min-h-screen bg-background">
      <Nav loggedIn={!!user} />
      <Hero />
      <Story />
      <Proposal />
      <Details />
      <UploadedGallery initial={paged} />
      <Gallery />
      <VideoSection />
      <Gift />
      <Footer />
    </main>
  );
}
