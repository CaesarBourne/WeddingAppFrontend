"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

type NavItem = { id: string; label: string; href?: string };

const NAV: NavItem[] = [
  { id: "story", label: "Our Story" },
  { id: "proposal", label: "The Proposal" },
  { id: "details", label: "Details" },
  { id: "rsvp", label: "RSVP" },
  { id: "gallery", label: "Gallery" },
  { id: "moments", label: "Wedding Gallery", href: "/moments" },
  { id: "food", label: "Food", href: "/food" },
  { id: "gift", label: "Gift" },
];

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reset hash-link active state whenever the route changes
  useEffect(() => {
    setActiveId(null);
  }, [pathname]);

  function isActive(n: NavItem): boolean {
    // Route-based items: match by pathname
    if (n.href) {
      return pathname === n.href || pathname.startsWith(`${n.href}/`);
    }
    // Hash/anchor items: match by manual click tracking
    return activeId === n.id;
  }

  function handleClick(n: NavItem) {
    setActiveId(n.id);
    setOpen(false);
  }

  const linkFor = (n: NavItem) => (n.href ? n.href : onHome ? `#${n.id}` : `/#${n.id}`);

  const renderLink = (n: NavItem, mobile = false) => {
    const active = isActive(n);

    if (mobile) {
      const mobileClass = `text-sm uppercase tracking-[0.2em] transition-colors ${
        active ? "text-gold font-semibold" : "text-foreground/80 hover:text-gold"
      }`;

      if (n.href) {
        return (
          <Link key={n.id} href={n.href} onClick={() => handleClick(n)} className={mobileClass}>
            {n.label}
          </Link>
        );
      }
      return (
        <a key={n.id} href={linkFor(n)} onClick={() => handleClick(n)} className={mobileClass}>
          {n.label}
        </a>
      );
    }

    // Desktop — all items share the same base style, with active highlighted in gold
    let inactiveColor = "text-white/90 hover:text-gold";
    if (scrolled || !onHome) inactiveColor = "text-foreground/80 hover:text-gold";
    const desktopClass = `relative text-xs uppercase tracking-[0.2em] transition-colors ${
      active ? "text-gold" : inactiveColor
    }`;

    const activeUnderline = active ? (
      <span
        className="absolute -bottom-1 left-0 right-0 h-px rounded-full bg-gold"
        style={{ backgroundColor: "#C9A46C" }}
      />
    ) : null;

    if (n.href) {
      return (
        <Link key={n.id} href={n.href} onClick={() => handleClick(n)} className={desktopClass}>
          {n.label}
          {activeUnderline}
        </Link>
      );
    }
    return (
      <a key={n.id} href={linkFor(n)} onClick={() => handleClick(n)} className={desktopClass}>
        {n.label}
        {activeUnderline}
      </a>
    );
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ${
        scrolled || !onHome ? "glass py-3 shadow-soft" : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-script text-2xl text-gradient-gold md:text-3xl">Emma</span>
          <span
            className={`font-serif-display text-sm tracking-[0.3em] ${
              scrolled || !onHome ? "text-foreground" : "text-white"
            }`}
          >
            &amp;
          </span>
          <span className="font-script text-2xl text-gradient-gold md:text-3xl">Funmi</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          <nav className="flex items-center gap-6 lg:gap-8">
            {NAV.map((n) => renderLink(n))}
          </nav>
          <ThemeToggle scrolled={scrolled || !onHome} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle scrolled={scrolled || !onHome} />
          <button
            onClick={() => setOpen(!open)}
            className={`p-2 ${scrolled || !onHome ? "text-foreground" : "text-white"}`}
            aria-label="Menu"
          >
            <div className="mb-1.5 h-px w-6 bg-current" />
            <div className="mb-1.5 h-px w-6 bg-current" />
            <div className="ml-auto h-px w-4 bg-current" />
          </button>
        </div>
      </div>

      {open && (
        <div className="glass mx-4 mt-3 animate-fade-up rounded-2xl p-6 md:hidden">
          <nav className="flex flex-col items-start gap-4">
            {NAV.map((n) => renderLink(n, true))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Nav;
