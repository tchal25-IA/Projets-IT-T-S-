import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "T&S CRM",
  description: "CRM multi-rôles — leads, clients, prestations",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "T&S CRM",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2f2c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
