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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        inter.variable,
        cormorant.variable,
        greatVibes.variable,
      )}
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
