"use client";

import { useReveal } from "@/hooks/use-reveal";

const img1 = "/wedding/proposal-1.jpeg";
const img3 = "/wedding/proposal-3.jpeg";
const img6 = "/wedding/proposal-6.jpeg";

const Proposal = () => {
  const ref = useReveal();
  return (
    <section
      id="proposal"
      ref={ref}
      className="section-dark scroll-mt-nav relative py-28 md:py-40 overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: "var(--gradient-candle)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-15"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--blush-deep)) 0%, transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="text-center mb-16 reveal">
          <p className="font-script text-3xl md:text-4xl shimmer-text mb-2">
            the proposal
          </p>
          <h2 className="font-serif-display text-4xl md:text-6xl text-foreground">
            A night written in candlelight
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-foreground font-light leading-relaxed">
            Beside the water, beneath letters that glowed like a promise — he
            knelt, she smiled, and the whole world held its breath.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6 max-w-6xl mx-auto">
          <div className="col-span-12 md:col-span-7 reveal">
            <div className="relative group overflow-hidden rounded-3xl shadow-elegant h-[500px] md:h-[640px]">
              <img
                src={img1}
                alt="The proposal moment"
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="font-script text-3xl md:text-4xl text-candle animate-flicker">
                  &quot;Yes.&quot;
                </p>
                <p className="text-cream/80 text-sm mt-2 tracking-wider">
                  — a single word, an entire forever
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-4 md:gap-6">
            <div className="reveal relative group overflow-hidden rounded-3xl shadow-elegant">
              <img
                src={img3}
                alt="On bended knee"
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
              />
            </div>
            <div className="reveal relative group overflow-hidden rounded-3xl shadow-elegant">
              <img
                src={img6}
                alt="Together"
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Proposal;
