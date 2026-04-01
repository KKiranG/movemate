import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import { AppClientEffects } from "@/components/layout/app-client-effects";
import { SiteHeader } from "@/components/layout/site-header";
import { assertRequiredEnv } from "@/lib/env";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://moverrr.com.au"),
  title: {
    default: "moverrr",
    template: "%s | moverrr",
  },
  description:
    "Browse posted truck and van capacity in Sydney for furniture, boxes, appliances, and other awkward-middle moves.",
  openGraph: {
    title: "moverrr",
    description:
      "Browse spare truck space in Sydney and book big-item moves without the quote chase.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertRequiredEnv();

  return (
    <html lang="en-AU">
      <body className={`${instrumentSans.variable} antialiased`}>
        <div className="min-h-screen bg-background">
          <AppClientEffects />
          <a
            href="#main-content"
            className="sr-only rounded border border-border bg-white px-4 py-2 text-sm font-medium text-text focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to main content
          </a>
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
