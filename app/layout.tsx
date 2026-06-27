import type { Metadata, Viewport } from "next";
import { Oxanium, Space_Grotesk, Space_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Display — sci-fi techno face with subtly cut corners that echo the notched
// HUD frames. Title, headers, opponent names, result words. (brief §5.3)
const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-src",
  display: "swap",
});

// Body — clean geometric sans for instructions, descriptions, labels.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Data — anything that's a "machine value": addresses, amounts, hashes, scores.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ritual · Tic Tac Toe — Onchain Arena",
  description:
    "Beat a Ritual team member at tic-tac-toe and write your win to the chain. Built for the Ritual testnet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b09",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.variable} ${spaceGrotesk.variable} ${spaceMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
