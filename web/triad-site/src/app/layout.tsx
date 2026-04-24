import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Triad | Dating, discovery, and local connection",
  description:
    "Triad is a dating and social discovery app for singles, couples, and community-aware connection.",
  applicationName: "Triad",
  metadataBase: new URL("https://triad.app"),
  openGraph: {
    title: "Triad",
    description: "Meet, discover, and connect around people, places, and shared plans.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
