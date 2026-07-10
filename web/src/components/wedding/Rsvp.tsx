"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { toast } from "sonner";

const Rsvp = () => {
  const ref = useReveal();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", attending: "yes", guests: 1, message: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you — your love has been noted 💌");
  };

  return (
    <section id="rsvp" ref={ref} className="scroll-mt-nav relative py-28 md:py-40 bg-cream dark:bg-background overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: "hsl(var(--blush))" }} />
      <div className="absolute top-1/2 -translate-y-1/2 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: "hsl(var(--lavender))" }} />

      <div className="container relative">
        <div className="text-center mb-14 reveal">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">kindly reply</p>
          <h2 className="font-serif-display text-4xl md:text-6xl">Be Part of Our Forever</h2>
          <p className="mt-6 max-w-lg mx-auto text-muted-foreground font-light">
            Your presence will make our day complete. Please share whether you can join us.
          </p>
        </div>

        <div className="max-w-xl mx-auto reveal">
          <div className="glass rounded-3xl p-8 md:p-12 shadow-elegant relative overflow-hidden">
            {submitted ? (
              <div className="text-center py-12 animate-fade-up">
                <div className="text-6xl mb-4">💌</div>
                <p className="font-script text-4xl text-gradient-gold mb-3">Thank you</p>
                <p className="font-serif-display text-2xl text-foreground/80">Your love has been received.</p>
                <p className="text-muted-foreground mt-3 text-sm">We&apos;ll be in touch with all the details.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-foreground/60 mb-2">Your Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/60 dark:bg-white/5 border border-border/60 rounded-xl px-4 py-3 font-serif-display text-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-foreground/60 mb-3">Will you attend?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {["yes", "no"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setForm({ ...form, attending: v })}
                        className={`py-3 rounded-xl border transition-all uppercase tracking-[0.2em] text-xs ${
                          form.attending === v
                            ? "bg-gradient-gold text-foreground border-transparent shadow-gold"
                            : "bg-white/60 dark:bg-white/5 border-border/60 text-foreground/70 hover:border-gold/60"
                        }`}
                      >
                        {v === "yes" ? "Joyfully Accepts" : "Regretfully Declines"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-foreground/60 mb-2">Number of Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: +e.target.value })}
                    className="w-full bg-white/60 dark:bg-white/5 border border-border/60 rounded-xl px-4 py-3 font-serif-display text-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-foreground/60 mb-2">A Message for the Couple</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/60 dark:bg-white/5 border border-border/60 rounded-xl px-4 py-3 font-serif-display text-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition resize-none"
                    placeholder="With love…"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-gold text-foreground rounded-full uppercase tracking-[0.25em] text-xs font-medium shadow-gold hover:scale-[1.02] hover:shadow-romance transition-all duration-500"
                >
                  Send With Love
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Rsvp;
