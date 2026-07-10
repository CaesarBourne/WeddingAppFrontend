import Nav from "@/components/wedding/Nav";
import Footer from "@/components/wedding/Footer";

export default function MomentsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="relative pt-40 pb-28 md:pt-48 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-romance opacity-50" />
        <div className="container relative text-center">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">moments</p>
          <h1 className="font-serif-display text-4xl md:text-6xl text-foreground">
            Coming Soon
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-muted-foreground font-light">
            Guests will soon be able to share and browse photos from the celebration here.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
