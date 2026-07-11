"use client";

import { useReveal } from "@/hooks/use-reveal";

const chapters = [
  {
    title: "How We Met",
    body: "Two paths drawn together by something quieter than coincidence. A conversation became a whole world.",
    img: "/wedding/proposal-2.jpeg",
    align: "left",
  },
  {
    title: "The Journey",
    body: "Through laughter, ordinary days and the occasional storm — we discovered home in one another.",
    img: "/wedding/proposal-4.jpeg",
    align: "right",
  },
  {
    title: "The Proposal",
    body: "Beneath candlelight and a sky over the lagoon, with neon glowing the words our hearts already knew — it was always you.",
    img: "/wedding/proposal-5.jpeg",
    align: "left",
  },
];

const Story = () => {
  const ref = useReveal();
  return (
    <section id="story" ref={ref} className="scroll-mt-nav relative py-28 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-romance opacity-50" />
      <div className="container relative">
        <div className="text-center mb-20 reveal">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">our story</p>
          <h2 className="font-serif-display text-4xl md:text-6xl text-foreground">Every love has a beginning</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-gold" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent hidden md:block" />
          <div className="space-y-24 md:space-y-32">
            {chapters.map((c, i) => (
              <div key={i} className={`reveal grid md:grid-cols-2 gap-10 md:gap-16 items-center ${c.align === "right" ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-gold opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-700" />
                  <div className="relative overflow-hidden rounded-3xl shadow-elegant">
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      className="w-full h-[420px] md:h-[520px] object-cover transition-transform duration-[1.6s] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
                <div className="relative">
                  <span className="font-script text-5xl text-gold/60">0{i + 1}</span>
                  <h3 className="font-serif-display text-3xl md:text-5xl mt-2 mb-5 text-foreground">{c.title}</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-light max-w-md">{c.body}</p>
                  <div className="mt-6 h-px w-20 bg-gradient-gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Story;
