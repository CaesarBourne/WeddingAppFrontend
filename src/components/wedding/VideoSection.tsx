"use client";

import { useReveal } from "@/hooks/use-reveal";

const video = "/wedding/proposal-video.mp4";

const VideoSection = () => {
  const ref = useReveal();
  return (
    <section ref={ref} className="relative py-28 md:py-40 bg-foreground overflow-hidden">
      <div className="container relative">
        <div className="text-center mb-12 reveal">
          <p className="font-script text-3xl md:text-4xl shimmer-text mb-2">a moment in motion</p>
          <h2 className="font-serif-display text-4xl md:text-6xl text-cream">Relive the Magic</h2>
        </div>
        <div className="reveal max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] overflow-hidden shadow-elegant group">
            <div className="absolute -inset-1 bg-gradient-gold opacity-30 blur-2xl group-hover:opacity-60 transition-opacity duration-1000" />
            <video
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className="relative w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
