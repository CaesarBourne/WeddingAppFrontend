import Nav from "@/components/wedding/Nav";
import Hero from "@/components/wedding/Hero";
import Story from "@/components/wedding/Story";
import Proposal from "@/components/wedding/Proposal";
import Details from "@/components/wedding/Details";
import Rsvp from "@/components/wedding/Rsvp";
import Gallery from "@/components/wedding/Gallery";
import VideoSection from "@/components/wedding/VideoSection";
import Gift from "@/components/wedding/Gift";
import Footer from "@/components/wedding/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Story />
      <Proposal />
      <Details />
      <Rsvp />
      <Gallery />
      <VideoSection />
      <Gift />
      <Footer />
    </main>
  );
}
