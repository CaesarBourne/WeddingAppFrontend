"use client";

import { useReveal } from "@/hooks/use-reveal";

const Gift = () => {
  const ref = useReveal();
  return (
    <section id="gift" ref={ref} className="scroll-mt-nav relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-romance opacity-60" />
      <div className="container relative">
        <div className="text-center mb-12 reveal">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">with love & blessings</p>
          <h2 className="font-serif-display text-4xl md:text-6xl">Celebrate With a Gift</h2>
        </div>

        <div className="max-w-2xl mx-auto reveal">
          <div className="glass rounded-[2rem] p-10 md:p-14 shadow-elegant text-center">
            <p className="font-serif-display text-xl md:text-2xl text-foreground/80 leading-relaxed mb-8">
              Your presence is the truest gift — but should you wish to bless our beginning,
              we are deeply grateful for your kindness.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-left mb-10">
              <div className="rounded-2xl border border-border/60 bg-white/40 dark:bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50 mb-1">Bank</p>
                <p className="font-serif-display text-lg">Emma & Funmi</p>
                <p className="text-sm text-muted-foreground mt-1">Account · ••• ••• ••••</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-white/40 dark:bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/50 mb-1">Mobile</p>
                <p className="font-serif-display text-lg">Quick Transfer</p>
                <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
              </div>
            </div>

            <button className="px-10 py-4 bg-gradient-gold text-foreground rounded-full uppercase tracking-[0.25em] text-xs font-medium shadow-gold hover:scale-105 hover:shadow-romance transition-all duration-500 animate-glow-pulse">
              Send a Gift
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gift;
