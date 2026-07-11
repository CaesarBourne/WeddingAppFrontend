"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

type NavItem = { id: string; label: string; href?: string; pill?: boolean };

const NAV: NavItem[] = [
  { id: "story", label: "Our Story" },
  { id: "proposal", label: "The Proposal" },
  { id: "details", label: "Details" },
  { id: "rsvp", label: "RSVP" },
  { id: "gallery", label: "Gallery" },
  { id: "moments", label: "Moments", href: "/moments", pill: true },
  { id: "gift", label: "Gift" },
];

const PILL_BASE =
  "inline-flex items-center justify-center rounded-full text-xs uppercase tracking-[0.2em] px-4 md:px-5 py-1.5 transition-all duration-200 ease-out text-white";
const PILL_STYLE = { backgroundColor: "#C9A46C" } as const;

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkFor = (n: NavItem) => (n.href ? n.href : onHome ? `#${n.id}` : `/#${n.id}`);

  const renderLink = (n: NavItem, mobile = false) => {
    const baseText = mobile
      ? "text-sm uppercase tracking-[0.2em] text-foreground/80 hover:text-gold"
      : `text-xs uppercase tracking-[0.2em] transition-colors hover:text-gold ${
          scrolled ? "text-foreground/80" : "text-white/90"
        }`;

    if (n.pill) {
      return (
        <Link
          key={n.id}
          href={n.href!}
          onClick={() => setOpen(false)}
          style={PILL_STYLE}
          className={`${PILL_BASE} hover:scale-[1.02] hover:[background-color:#D4B07A]`}
        >
          {n.label}
        </Link>
      );
    }
    if (n.href) {
      return (
        <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className={baseText}>
          {n.label}
        </Link>
      );
    }
    return (
      <a key={n.id} href={linkFor(n)} onClick={() => setOpen(false)} className={baseText}>
        {n.label}
      </a>
    );
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled || !onHome ? "py-3 glass shadow-soft" : "py-5 bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-script text-2xl md:text-3xl text-gradient-gold">Emma</span>
          <span className={`font-serif-display text-sm tracking-[0.3em] ${scrolled || !onHome ? "text-foreground" : "text-white"}`}>&</span>
          <span className="font-script text-2xl md:text-3xl text-gradient-gold">Funmi</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <nav className="flex items-center gap-6 lg:gap-8">
            {NAV.map((n) => renderLink(n))}
          </nav>
          <ThemeToggle scrolled={scrolled || !onHome} />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle scrolled={scrolled || !onHome} />
          <button
            onClick={() => setOpen(!open)}
            className={`p-2 ${scrolled || !onHome ? "text-foreground" : "text-white"}`}
            aria-label="Menu"
          >
            <div className="w-6 h-px bg-current mb-1.5" />
            <div className="w-6 h-px bg-current mb-1.5" />
            <div className="w-4 h-px bg-current ml-auto" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden glass mt-3 mx-4 rounded-2xl p-6 animate-fade-up">
          <nav className="flex flex-col gap-4 items-start">
            {NAV.map((n) => renderLink(n, true))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Nav;
