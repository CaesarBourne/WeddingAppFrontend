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
import type { PagedPhotos } from "@/lib/types";

export default async function Home() {
  const res = await apiFetch("/photos", { params: { page: 1, pageSize: 12 } });
  const paged: PagedPhotos = res.ok
    ? ((await res.json()) as PagedPhotos)
    : { data: [], meta: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };

  return (
    <main className="min-h-screen bg-background">
      <Nav />
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
