const heroImg = "/wedding/proposal-1.jpeg";

const Hero = () => {
  return (
    <section id="top" className="relative h-screen min-h-[640px] w-full overflow-hidden">
      <div
        className="absolute inset-0 animate-ken-burns"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero-overlay)" }}
      />

      {/* Candle glow accents */}
      <div className="absolute left-[8%] bottom-[18%] w-40 h-40 rounded-full animate-flicker" style={{ background: "var(--gradient-candle)" }} />
      <div className="absolute right-[10%] bottom-[22%] w-56 h-56 rounded-full animate-flicker" style={{ background: "var(--gradient-candle)", animationDelay: "1.2s" }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <p className="font-script text-3xl md:text-5xl text-candle animate-fade-in-soft animate-flicker mb-6 drop-shadow-lg">
          It was always you
        </p>
        <h1 className="font-serif-display text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tight animate-fade-up leading-[0.95]">
          Emmanuel
          <span className="block font-script text-gradient-gold text-4xl md:text-6xl lg:text-7xl my-3 md:my-5">&</span>
          Funmilayo
        </h1>
        <div className="mt-8 mb-10 flex items-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <span className="h-px w-16 bg-gradient-gold" />
          <span className="text-white/90 text-xs md:text-sm uppercase tracking-[0.4em]">Forever Begins Soon</span>
          <span className="h-px w-16 bg-gradient-gold" />
        </div>
        <a
          href="#story"
          className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-gold text-foreground font-medium uppercase tracking-[0.25em] text-xs rounded-full shadow-gold hover:shadow-romance transition-all duration-500 hover:scale-105 animate-glow-pulse animate-fade-up"
          style={{ animationDelay: "0.6s" }}
        >
          Celebrate With Us
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/70 text-[10px] uppercase tracking-[0.4em]">Scroll</span>
          <div className="relative w-px h-12 bg-white/20 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-transparent via-candle to-transparent" style={{ animation: "scroll-indicator 2.2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
