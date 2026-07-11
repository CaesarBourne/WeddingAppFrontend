"use client";

import { useReveal } from "@/hooks/use-reveal";

// Set to a Date string when known, otherwise null
const WEDDING_DATE: string | null = null;

const Details = () => {
  const ref = useReveal();
  const known = !!WEDDING_DATE;

  return (
    <section id="details" ref={ref} className="scroll-mt-nav relative py-28 md:py-40 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-romance opacity-40" />
      <div className="container relative">
        <div className="text-center mb-14 reveal">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">save the date</p>
          <h2 className="font-serif-display text-4xl md:text-6xl">The Celebration</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-gold" />
        </div>

        <div className="max-w-3xl mx-auto reveal">
          <div className="glass rounded-[2rem] p-10 md:p-16 shadow-elegant text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-40" style={{ background: "hsl(var(--blush))" }} />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-40" style={{ background: "hsl(var(--lavender))" }} />

            <div className="relative">
              {known ? (
                <>
                  <p className="font-serif-display text-2xl md:text-3xl text-foreground/70 mb-2">Mark your hearts for</p>
                  <p className="font-serif-display text-4xl md:text-6xl text-gradient-gold mb-8">{new Date(WEDDING_DATE!).toDateString()}</p>
                  {/* Countdown placeholder if date is set */}
                </>
              ) : (
                <>
                  <p className="font-script text-4xl md:text-5xl text-gradient-gold mb-6 animate-flicker">A beautiful day is being prepared…</p>
                  <p className="font-serif-display text-xl md:text-2xl text-foreground/80 max-w-xl mx-auto leading-relaxed">
                    Our forever begins soon. We can&apos;t wait to share the date with you.
                  </p>

                  <div className="mt-12 grid grid-cols-4 gap-3 md:gap-6 max-w-xl mx-auto">
                    {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
                      <div key={label} className="aspect-square rounded-2xl bg-gradient-glass border border-white/40 flex flex-col items-center justify-center relative overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-60"
                          style={{
                            background: "linear-gradient(110deg, transparent 30%, hsl(var(--gold) / 0.35) 50%, transparent 70%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2.8s linear infinite",
                          }}
                        />
                        <span className="relative font-serif-display text-3xl md:text-5xl text-foreground/30">—</span>
                        <span className="relative text-[10px] md:text-xs uppercase tracking-[0.25em] text-foreground/50 mt-1">{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-12 flex items-center justify-center gap-4">
                <span className="h-px w-12 bg-gradient-gold" />
                <span className="font-script text-2xl text-gold">soon</span>
                <span className="h-px w-12 bg-gradient-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Details;
