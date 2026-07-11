const Footer = () => {
  return (
    <footer className="relative bg-foreground text-cream py-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-10" style={{ background: "var(--gradient-candle)" }} />
      <div className="container relative text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="font-script text-5xl md:text-6xl text-gradient-gold">Emma</span>
          <span className="font-serif-display text-2xl text-cream/60">&</span>
          <span className="font-script text-5xl md:text-6xl text-gradient-gold">Funmi</span>
        </div>
        <p className="font-script text-2xl md:text-3xl text-candle animate-flicker mb-3">Forever begins with you</p>
        <div className="mx-auto h-px w-32 bg-gradient-gold mb-6 opacity-60" />
        <p className="text-cream/50 text-xs uppercase tracking-[0.3em]">It Was Always You · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};

export default Footer;
