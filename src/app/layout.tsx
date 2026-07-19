import type { Metadata } from "next";
import "./globals.css";
import { Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif-display",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_COUPLE_NAMES,
  description: env.NEXT_PUBLIC_TAGLINE,
};

// Applies the saved (or system) theme before first paint, on EVERY page — so the
// dark/light choice is consistent everywhere (including /admin, which has no
// ThemeToggle) with no flash. Kept in sync with use-theme's storage key.
const themeScript = `
(function(){try{
  var t=localStorage.getItem('emma-funmi-theme');
  var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(dark)document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        inter.variable,
        cormorant.variable,
        greatVibes.variable,
      )}
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
